# Verifiable tool contracts

Implemented in source after v0.4.1. Build this checkout to use the CLI below. The public endpoint and published npm package acquire this feature only after a separate release and deployment; this document is not deployment evidence.

## Inspect before an upgrade

```sh
npm run build
node dist/cli.js manifest > /tmp/moretes-contract.json
node dist/cli.js describe capacity_plan
```

`manifest` runs locally without network, models, AWS credentials or quota charges. It accepts no arguments. `describe` now includes the same input schema, available output schema and safety annotations returned by MCP discovery, plus the existing `external` flag.

The manifest contains:

- `algorithm: sha256-sorted-json-v1` and `digest` for the complete `snapshot`.
- `snapshot.schemaVersion: 1`, server name/version, `scope: public-tools`, and tools sorted by name.
- Per-tool name, description, input schema, output schema when declared, and `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`.
- `toolDigests` to compare individual tools. Server version changes affect the aggregate digest but not fingerprints of unchanged descriptors.

The same descriptor builder serves actual MCP `tools/list`, CLI inspection and manifest generation. To hash a snapshot, recursively sort object keys with JavaScript's default string sort, preserve array order, serialize with `JSON.stringify`, encode UTF-8 and apply SHA-256. Tool descriptors are sorted by name before building a snapshot. This project-specific algorithm is not RFC 8785 canonicalization.

Verify a saved manifest with a reviewed source build:

```sh
node --input-type=module - /tmp/moretes-contract.json <<'JS'
import {readFileSync} from 'node:fs';
import {contractDigest} from './dist/contracts.js';
const manifest = JSON.parse(readFileSync(process.argv[2], 'utf8'));
if (manifest.algorithm !== 'sha256-sorted-json-v1') throw new Error('Unsupported algorithm');
if (contractDigest(manifest.snapshot) !== manifest.digest) throw new Error('Digest mismatch');
console.log(manifest.digest);
JS
```

Keep a trusted copy of a reviewed baseline. Compare individual hashes to locate changed tools, then review the actual descriptor diffs. A changed hash is not automatically a defect; an unchanged hash does not prove unchanged implementation behavior.

## HTTP monitoring after deployment

`GET /manifest.json` returns the same snapshot as the CLI of the same source build. Only public definitions appear, even when local account/provider opt-ins are set. No tools execute and no inputs, secrets, account IDs or customer data are included.

The ETag is the quoted aggregate digest; the cache lifetime is five minutes. `If-None-Match` accepts exact/weak tags, lists and `*`; a match returns 304 without a body. `/health` includes `contractDigest` for diagnostics, without proving external dependency health.

```sh
# Start the local HTTP server separately with npm run http.
curl -fsS http://127.0.0.1:8787/manifest.json > /tmp/moretes-http-contract.json
```

Origin restrictions also apply. Monitoring this route does not grant AWS access, run providers or enroll an external service.

## Maintainer baseline and CI

`docs/tools.lock.json` remains the historical name + description + input-schema lock in its original format. Its hashes are not interchangeable with this manifest or an external monitor's raw tools/list hash.

`docs/contracts.lock.json` stores aggregate/per-tool fingerprints and format/server metadata. Full descriptors are available through `manifest`; the compact lock avoids duplicating all schemas in Git. After reviewing a deliberate change:

```sh
npm run build
npm run contracts
npm run build
npm test
```

The generator uses freshly generated output schemas, not stale JSON from a previous build. CI checks both locks and the output schemas. Tests compare the baseline with actual MCP discovery and HTTP/CLI output; clean consumer installation compares packaged CLI output with stdio discovery.

Output schemas remain permissive contracts inferred from examples for 42 deterministic tools; six external tools have no declared output schema. Missing schemas remain visible rather than fabricated. Hashes are integrity/diff aids, not signatures, security assessments, compatibility guarantees or proof of execution/adoption. Validate implementation behavior separately.
