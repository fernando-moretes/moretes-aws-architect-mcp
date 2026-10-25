import { z } from 'zod';
import { tool, provenance } from './definition.js';

/**
 * Infrastructure-as-code reviews that work on exported artifacts, not on live
 * accounts: Terraform plan JSON (any provider) and Kubernetes manifests.
 * Heuristic subsets with explicit limitations; they never run terraform or kubectl.
 */

type Finding = { severity: 'high' | 'medium' | 'info'; target: string; message: string };
const object = (v: unknown): Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const arr = (v: unknown): unknown[] => Array.isArray(v) ? v : v === undefined ? [] : [v];

/** Resource types whose destruction or replacement loses data or identity. */
const STATEFUL = /(db_instance|rds_cluster|dynamodb_table|s3_bucket$|efs_file_system|elasticache|redshift|kms_key|cognito_user_pool|route53_zone|secretsmanager_secret$|sql_database|storage_account|cosmosdb|key_vault$|sql_database_instance|storage_bucket$|bigquery_dataset|spanner|autonomous_database|object_storage_bucket|eks_cluster|kubernetes_cluster|container_cluster|iam_role$|iam_user$|service_account$)/i;

export function reviewTerraformPlan(plan: Record<string, unknown>): { findings: Finding[]; actions: Record<string, number>; resources: number } {
  const changes = arr(plan.resource_changes).map(object);
  if (!changes.length) throw new Error('resource_changes is empty; export with `terraform show -json tfplan`');
  if (changes.length > 2000) throw new Error('Maximum 2000 resource changes');
  const findings: Finding[] = [];
  const actions: Record<string, number> = { create: 0, update: 0, delete: 0, replace: 0, 'no-op': 0, read: 0 };
  for (const rc of changes) {
    const change = object(rc.change);
    const acts = arr(change.actions).map(String);
    const address = String(rc.address ?? rc.type ?? 'unknown');
    const type = String(rc.type ?? '');
    const key = acts.includes('delete') && acts.includes('create') ? 'replace' : acts[0] ?? 'no-op';
    actions[key] = (actions[key] ?? 0) + 1;
    const after = object(change.after);
    if ((key === 'delete' || key === 'replace') && STATEFUL.test(type)) findings.push({ severity: 'high', target: address, message: `${key} of a stateful resource (${type}); confirm backups, data migration and whether a moved block or lifecycle prevent_destroy was intended.` });
    if (key === 'replace') {
      const reasons = arr(change.replace_paths).map(p => arr(p).join('.')).filter(Boolean);
      findings.push({ severity: STATEFUL.test(type) ? 'high' : 'medium', target: address, message: `Replacement${reasons.length ? ` forced by: ${reasons.join(', ')}` : ''}; expect downtime for this resource.` });
    }
    if (key === 'create' || key === 'update' || key === 'replace') {
      const text = JSON.stringify(after);
      if (/"(publicly_accessible|public_network_access_enabled)":true/.test(text) || /"public_network_access":"Enabled"/.test(text)) findings.push({ severity: 'high', target: address, message: 'Public network access enabled.' });
      if (/"cidr_blocks":\[[^\]]*"0\.0\.0\.0\/0"/.test(text) || /"source_address_prefix":"\*"/.test(text) || /"source_ranges":\[[^\]]*"0\.0\.0\.0\/0"/.test(text)) findings.push({ severity: 'medium', target: address, message: 'Ingress from the entire internet; verify ports and intent.' });
      if (/"(acl|access)":"public-read(-write)?"/.test(text) || /"allow_blob_public_access":true/.test(text) || /"uniform_bucket_level_access":false/.test(text)) findings.push({ severity: 'high', target: address, message: 'Public or legacy ACL on storage.' });
      if (/"(encrypted|storage_encrypted|encryption_enabled|enable_encryption)":false/.test(text)) findings.push({ severity: 'medium', target: address, message: 'Encryption explicitly disabled.' });
      if (/"(deletion_protection|deletion_protection_enabled)":false/.test(text) && STATEFUL.test(type)) findings.push({ severity: 'info', target: address, message: 'Deletion protection disabled on a stateful resource.' });
      if (/"skip_final_snapshot":true/.test(text)) findings.push({ severity: 'medium', target: address, message: 'skip_final_snapshot=true: a destroy will not keep a snapshot.' });
      if (/"policy":"[^"]*\\"Action\\":\\"\*\\"[^"]*\\"Resource\\":\\"\*\\"/.test(text) || /"actions":\["\*"\]/.test(text)) findings.push({ severity: 'high', target: address, message: 'Policy allows every action on every resource.' });
      if (/"(password|secret|token|private_key|client_secret)":"(?!\$\{)[^"]{6,}"/i.test(text)) findings.push({ severity: 'high', target: address, message: 'Literal credential in planned attributes; use a secrets manager or sensitive variable.' });
      if (/"(logging|logging_enabled|enable_logging|log_analytics)":(false|\[\])/.test(text)) findings.push({ severity: 'info', target: address, message: 'Logging disabled or empty.' });
      if (/"(versioning|versioning_enabled)":(false|\[\{"enabled":false)/.test(text)) findings.push({ severity: 'info', target: address, message: 'Versioning disabled on storage.' });
    }
  }
  const outputs = object(plan.output_changes);
  for (const [name, o] of Object.entries(outputs)) if (object(o).after_sensitive === false && /(secret|password|token|key)/i.test(name)) findings.push({ severity: 'medium', target: `output.${name}`, message: 'Output name suggests a secret but it is not marked sensitive.' });
  const providers = object(object(plan.configuration).provider_config);
  for (const [name, p] of Object.entries(providers)) { const ver = object(p).version_constraint; if (!ver) findings.push({ severity: 'info', target: `provider.${name}`, message: 'No version constraint; plan output may change between runs.' }); }
  if ((actions.delete ?? 0) + (actions.replace ?? 0) > 10) findings.push({ severity: 'medium', target: 'plan', message: `${(actions.delete ?? 0) + (actions.replace ?? 0)} deletions/replacements in one plan; split the change or confirm it is intentional.` });
  return { findings, actions, resources: changes.length };
}

export function reviewKubernetesManifests(manifests: Record<string, unknown>[]): Finding[] {
  const findings: Finding[] = [];
  const workloadKinds = new Set(['Deployment', 'StatefulSet', 'DaemonSet', 'Job', 'CronJob', 'Pod', 'ReplicaSet']);
  const deployments: { name: string; ns: string; replicas: number; labels: Record<string, unknown> }[] = [];
  const pdbs: Record<string, unknown>[] = [];
  const netpols = new Set<string>();
  for (const m of manifests) {
    const kind = String(m.kind ?? ''), meta = object(m.metadata), name = String(meta.name ?? 'unnamed'), ns = String(meta.namespace ?? 'default');
    const target = `${kind}/${name}`;
    if (kind === 'PodDisruptionBudget') pdbs.push(m);
    if (kind === 'NetworkPolicy') netpols.add(ns);
    if (kind === 'Secret' && m.stringData) findings.push({ severity: 'high', target, message: 'Secret with stringData committed as a manifest; use an external secret store or sealed secrets.' });
    if (kind === 'Service' && object(m.spec).type === 'LoadBalancer') findings.push({ severity: 'info', target, message: 'LoadBalancer service creates a public endpoint unless annotated internal; confirm exposure.' });
    if (kind === 'Ingress' && !object(m.spec).tls) findings.push({ severity: 'medium', target, message: 'Ingress without TLS.' });
    if (!workloadKinds.has(kind)) continue;
    if (!meta.namespace) findings.push({ severity: 'info', target, message: 'No namespace; defaults to "default".' });
    const spec = object(m.spec);
    const podSpec = kind === 'Pod' ? spec : kind === 'CronJob' ? object(object(object(object(spec.jobTemplate).spec).template).spec) : object(object(spec.template).spec);
    const podSecurity = object(podSpec.securityContext);
    if (podSpec.hostNetwork === true) findings.push({ severity: 'high', target, message: 'hostNetwork=true shares the node network namespace.' });
    if (podSpec.hostPID === true || podSpec.hostIPC === true) findings.push({ severity: 'high', target, message: 'hostPID or hostIPC enabled.' });
    if (podSpec.automountServiceAccountToken !== false && !podSpec.serviceAccountName) findings.push({ severity: 'info', target, message: 'Default service account token mounted; set automountServiceAccountToken=false unless the API is used.' });
    for (const v of arr(podSpec.volumes).map(object)) if (v.hostPath) findings.push({ severity: 'high', target, message: `hostPath volume (${object(v.hostPath).path ?? ''}) exposes the node filesystem.` });
    if (kind === 'Deployment' || kind === 'StatefulSet') deployments.push({ name, ns, replicas: Number(spec.replicas ?? 1), labels: object(object(spec.template).metadata).labels as Record<string, unknown> ?? {} });
    if ((kind === 'Deployment' || kind === 'StatefulSet') && Number(spec.replicas ?? 1) < 2) findings.push({ severity: 'medium', target, message: 'Single replica; any restart is downtime.' });
    if (kind === 'Deployment' && !object(spec.strategy).type && Number(spec.replicas ?? 1) > 1) findings.push({ severity: 'info', target, message: 'No update strategy declared; set rolling update surge and unavailable limits.' });
    for (const c of [...arr(podSpec.containers), ...arr(podSpec.initContainers)].map(object)) {
      const cname = `${target}/${c.name ?? 'container'}`;
      const image = String(c.image ?? '');
      if (!image) findings.push({ severity: 'high', target: cname, message: 'No image.' });
      else if (!image.includes('@sha256:') && (!image.includes(':') || image.endsWith(':latest'))) findings.push({ severity: 'medium', target: cname, message: 'Image without a pinned tag or digest (latest or untagged).' });
      const res = object(c.resources);
      if (!object(res.limits).memory) findings.push({ severity: 'medium', target: cname, message: 'No memory limit; a leak evicts neighbors.' });
      if (!object(res.requests).cpu || !object(res.requests).memory) findings.push({ severity: 'medium', target: cname, message: 'Missing CPU or memory request; scheduling and autoscaling cannot reason about it.' });
      if (kind !== 'Job' && kind !== 'CronJob' && !c.livenessProbe) findings.push({ severity: 'medium', target: cname, message: 'No livenessProbe.' });
      if (kind !== 'Job' && kind !== 'CronJob' && !c.readinessProbe) findings.push({ severity: 'medium', target: cname, message: 'No readinessProbe; traffic reaches the pod before it is ready.' });
      const sc = { ...podSecurity, ...object(c.securityContext) };
      if (sc.privileged === true) findings.push({ severity: 'high', target: cname, message: 'privileged=true.' });
      if (sc.runAsNonRoot !== true && sc.runAsUser === undefined) findings.push({ severity: 'medium', target: cname, message: 'May run as root; set runAsNonRoot=true.' });
      if (sc.allowPrivilegeEscalation !== false) findings.push({ severity: 'info', target: cname, message: 'allowPrivilegeEscalation not set to false.' });
      if (sc.readOnlyRootFilesystem !== true) findings.push({ severity: 'info', target: cname, message: 'Root filesystem is writable.' });
      if (!arr(object(sc.capabilities).drop).map(String).includes('ALL')) findings.push({ severity: 'info', target: cname, message: 'Capabilities not dropped (drop: [ALL]).' });
      for (const e of arr(c.env).map(object)) if (/(PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY)/i.test(String(e.name)) && typeof e.value === 'string') findings.push({ severity: 'high', target: cname, message: `Literal secret in env ${e.name}; use secretKeyRef or an external secret store.` });
    }
  }
  for (const d of deployments) {
    if (d.replicas > 1 && !pdbs.some(p => { const sel = object(object(object(p.spec).selector).matchLabels); return Object.entries(sel).every(([k, v]) => d.labels[k] === v) && Object.keys(sel).length > 0; })) findings.push({ severity: 'info', target: `Deployment/${d.name}`, message: 'No PodDisruptionBudget matches this workload; node drains can take every replica down.' });
    if (!netpols.has(d.ns)) findings.push({ severity: 'info', target: `Deployment/${d.name}`, message: `No NetworkPolicy in namespace ${d.ns}; all pod-to-pod traffic is allowed.` });
  }
  return findings;
}


/** Azure custom role definition (properties or flat) and GCP IAM policy bindings. */
export function reviewCloudIam(provider: 'azure' | 'gcp', doc: Record<string, unknown>): Finding[] {
  const findings: Finding[] = [];
  if (provider === 'azure') {
    const props = object(doc.properties ?? doc);
    const perms = arr(props.permissions ?? [{ actions: props.Actions ?? props.actions, notActions: props.NotActions ?? props.notActions, dataActions: props.DataActions ?? props.dataActions }]).map(object);
    const scopes = arr(props.assignableScopes ?? props.AssignableScopes).map(String);
    if (!perms.length) throw new Error('Azure role definition needs permissions (actions/notActions/dataActions)');
    perms.forEach((p, i) => {
      const at = `permissions[${i}]`;
      const actions = arr(p.actions ?? p.Actions).map(String), notActions = arr(p.notActions ?? p.NotActions).map(String), dataActions = arr(p.dataActions ?? p.DataActions).map(String);
      if (actions.includes('*')) findings.push({ severity: 'high', target: at, message: notActions.length ? 'actions "*" with notActions grants everything except the exclusions; new resource providers are allowed automatically.' : 'actions "*" is Owner-equivalent control plane access.' });
      for (const a of actions) if (a !== '*' && /\/\*$|\*\/(write|delete|action)$/i.test(a)) findings.push({ severity: 'medium', target: at, message: `Wildcard action ${a}; enumerate the operations the workload needs.` });
      if (actions.some(a => /Microsoft\.Authorization\/(\*|roleAssignments\/write|roleDefinitions\/write)/i.test(a))) findings.push({ severity: 'high', target: at, message: 'Can create role assignments or definitions: privilege escalation path.' });
      if (dataActions.includes('*')) findings.push({ severity: 'high', target: at, message: 'dataActions "*" reads and writes data in every data plane the role reaches.' });
      if (actions.some(a => /listKeys|listkeys|regenerateKey/i.test(a))) findings.push({ severity: 'medium', target: at, message: 'Can list or regenerate access keys, which bypass RBAC on the data plane.' });
    });
    if (!scopes.length) findings.push({ severity: 'info', target: 'assignableScopes', message: 'No assignableScopes; the definition cannot be assigned and scope cannot be assessed.' });
    for (const sc of scopes) if (sc === '/' || /^\/providers\/Microsoft\.Management\/managementGroups\//i.test(sc)) findings.push({ severity: 'medium', target: 'assignableScopes', message: `Broad assignable scope ${sc}; prefer subscription or resource group.` });
  } else {
    const bindings = arr(doc.bindings).map(object);
    if (!bindings.length) throw new Error('GCP IAM policy needs bindings[] (gcloud ... get-iam-policy --format=json)');
    bindings.forEach((b, i) => {
      const role = String(b.role ?? ''), members = arr(b.members).map(String), at = `bindings[${i}] ${role}`;
      if (/^roles\/(owner|editor)$/.test(role)) findings.push({ severity: 'high', target: at, message: 'Basic role (owner/editor) grants thousands of permissions; use predefined or custom roles.' });
      else if (/\.admin$|^roles\/iam\.|securityAdmin/i.test(role)) findings.push({ severity: 'medium', target: at, message: 'Administrative role; confirm who needs it and add a condition or time bound.' });
      if (/serviceAccountTokenCreator|serviceAccountUser|serviceAccountKeyAdmin|workloadIdentityUser/.test(role)) findings.push({ severity: 'high', target: at, message: 'Allows impersonating service accounts or minting their keys: privilege escalation path.' });
      for (const m of members) {
        if (m === 'allUsers' || m === 'allAuthenticatedUsers') findings.push({ severity: 'high', target: at, message: `${m} makes this binding public.` });
        else if (/^domain:/.test(m)) findings.push({ severity: 'info', target: at, message: `Whole domain ${m.slice(7)} is a member; confirm the blast radius.` });
        else if (/^user:.*@gmail\.com$/.test(m)) findings.push({ severity: 'medium', target: at, message: `Consumer account ${m} outside the organization's identity governance.` });
        else if (/^deleted:/.test(m)) findings.push({ severity: 'info', target: at, message: `Stale member ${m}; remove it.` });
      }
      if (!b.condition && /admin|owner|editor|TokenCreator/i.test(role)) findings.push({ severity: 'info', target: at, message: 'No IAM condition on a privileged role; consider resource or time conditions.' });
    });
    if (!doc.etag) findings.push({ severity: 'info', target: 'etag', message: 'No etag; when writing the policy back, use the etag to avoid overwriting concurrent changes.' });
  }
  return findings;
}

export const summarize = (f: Finding[]) => ({ high: f.filter(x => x.severity === 'high').length, medium: f.filter(x => x.severity === 'medium').length, info: f.filter(x => x.severity === 'info').length });

export const iacTools = [
  tool('terraform_plan_review',
    'Review a Terraform or OpenTofu plan exported as JSON (terraform show -json): deletions and replacements of stateful resources, public exposure, disabled encryption, literal credentials, broad policies and unpinned providers. Any provider; heuristic.',
    { plan: z.record(z.string(), z.unknown()) },
    a => {
      if (!a.plan.format_version && !a.plan.resource_changes) throw new Error('Not a Terraform plan JSON (missing format_version/resource_changes)');
      const r = reviewTerraformPlan(a.plan);
      return {
        ...provenance,
        kind: 'terraform-plan-heuristic-review',
        terraformVersion: a.plan.terraform_version ?? null,
        resources: r.resources,
        actions: r.actions,
        findings: r.findings,
        summary: summarize(r.findings),
        gate: r.findings.some(f => f.severity === 'high') ? 'Block: high findings need a human decision before apply' : 'Proceed with normal review; no high-severity pattern matched',
        limitations: ['Pattern matching on planned attribute values; unknown-after-apply values are invisible', 'Not a replacement for policy as code (OPA/Conftest, Sentinel, Checkov, tfsec) or for reading the plan diff', 'A clean result is not an approval to apply'],
        sources: ['https://developer.hashicorp.com/terraform/internals/json-format']
      };
    }),

  tool('kubernetes_manifest_review',
    'Review Kubernetes manifests (parsed JSON objects) for probes, resources, security context, image pinning, host access, secrets in env, PDB and NetworkPolicy coverage. No cluster access.',
    { manifests: z.array(z.record(z.string(), z.unknown())).min(1).max(300) },
    a => {
      const items = a.manifests.flatMap(m => m.kind === 'List' ? arr(m.items).map(object) : [m]);
      if (items.some(m => !m.kind)) throw new Error('Every manifest needs a kind');
      const findings = reviewKubernetesManifests(items);
      return {
        ...provenance,
        kind: 'kubernetes-heuristic-review',
        objects: items.length,
        kinds: [...new Set(items.map(m => String(m.kind)))],
        findings,
        summary: summarize(findings),
        limitations: ['Static checks on the manifests provided; admission policies, cluster defaults and LimitRanges are not visible', 'Convert YAML to JSON before calling (one object per document)', 'Use Pod Security Admission, Kyverno or kube-linter for enforcement'],
        sources: ['https://kubernetes.io/docs/concepts/security/pod-security-standards/']
      };
    })
];
