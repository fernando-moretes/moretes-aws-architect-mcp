# Tool reference

Generated from the registered schemas. Public tools are read-only; local provider calls may mutate resources. Use tools/list in your client for exact current schemas.

## Public HTTP / stdio

### requirements_check

Turn a workload brief into explicit requirements, gaps and research questions. No inferred SLA or budget.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "workload": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "requirements": {
      "default": [],
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    },
    "constraints": {
      "default": [],
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    }
  },
  "required": [
    "workload",
    "requirements",
    "constraints"
  ],
  "additionalProperties": false
}
```

### architecture_pattern

Select a reference architecture by explicit workload pattern; returns tradeoffs, questions and Mermaid.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "pattern": {
      "type": "string",
      "enum": [
        "serverless-api",
        "container-api",
        "event-driven",
        "rag",
        "agent-platform"
      ]
    },
    "workload": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    }
  },
  "required": [
    "pattern",
    "workload"
  ],
  "additionalProperties": false
}
```

### service_compare

Compare curated AWS service families against user constraints. No automatic winner or fabricated scores.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "family": {
      "type": "string",
      "enum": [
        "compute",
        "database",
        "messaging",
        "rag-store"
      ]
    },
    "constraints": {
      "default": [],
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    }
  },
  "required": [
    "family",
    "constraints"
  ],
  "additionalProperties": false
}
```

### decision_record

Generate an ADR from explicit alternatives, decision and consequences. Does not invent acceptance.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "context": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "options": {
      "minItems": 2,
      "maxItems": 10,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200
      }
    },
    "decision": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "consequences": {
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    },
    "status": {
      "default": "proposed",
      "type": "string",
      "enum": [
        "proposed",
        "accepted",
        "superseded"
      ]
    }
  },
  "required": [
    "title",
    "context",
    "options",
    "decision",
    "consequences",
    "status"
  ],
  "additionalProperties": false
}
```

### well_architected_review

Organize evidence by six pillars. A met control without evidence is unknown, never certified.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "workload": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "controls": {
      "minItems": 1,
      "maxItems": 80,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "pillar": {
            "type": "string",
            "enum": [
              "operational-excellence",
              "security",
              "reliability",
              "performance",
              "cost",
              "sustainability"
            ]
          },
          "status": {
            "type": "string",
            "enum": [
              "met",
              "gap",
              "unknown"
            ]
          },
          "evidence": {
            "default": "",
            "type": "string",
            "maxLength": 4000
          },
          "owner": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          }
        },
        "required": [
          "id",
          "pillar",
          "status",
          "evidence"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "workload",
    "controls"
  ],
  "additionalProperties": false
}
```

### threat_model

Create STRIDE review prompts for explicitly supplied assets and trust boundaries. Review aid, not a scanner.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "assets": {
      "minItems": 1,
      "maxItems": 15,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200
      }
    },
    "boundaries": {
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    },
    "dataClassification": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    }
  },
  "required": [
    "assets",
    "boundaries",
    "dataClassification"
  ],
  "additionalProperties": false
}
```

### failure_rehearsal

Design a controlled failure drill with observable success criteria and stop conditions; never executes it.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "target": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "failure": {
      "type": "string",
      "enum": [
        "timeout",
        "duplicate",
        "drift",
        "after-write-crash",
        "revocation",
        "dependency-outage"
      ]
    }
  },
  "required": [
    "operation",
    "target",
    "failure"
  ],
  "additionalProperties": false
}
```

### capacity_plan

Calculate concurrency and daily data volume from explicit traffic assumptions. No service sizing guarantee.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "requestsPerSecond": {
      "type": "number",
      "minimum": 0,
      "maximum": 1000000000
    },
    "durationMs": {
      "type": "number",
      "minimum": 0,
      "maximum": 86400000
    },
    "payloadKB": {
      "type": "number",
      "minimum": 0,
      "maximum": 1000000000
    },
    "headroom": {
      "default": 1.3,
      "type": "number",
      "minimum": 1,
      "maximum": 10
    }
  },
  "required": [
    "requestsPerSecond",
    "durationMs",
    "payloadKB",
    "headroom"
  ],
  "additionalProperties": false
}
```

### cost_model

Calculate an auditable scenario using caller-supplied unit rates and source URLs. Does not guess AWS prices or credit coverage.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "currency": {
      "default": "USD",
      "type": "string",
      "enum": [
        "USD",
        "BRL"
      ]
    },
    "items": {
      "minItems": 1,
      "maxItems": 50,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "quantity": {
            "type": "number",
            "minimum": 0,
            "maximum": 1000000000000000
          },
          "unit": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "pricePerUnit": {
            "type": "number",
            "minimum": 0,
            "maximum": 1000000000
          },
          "source": {
            "type": "string",
            "format": "uri"
          },
          "priceDate": {
            "type": "string",
            "format": "date",
            "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
          }
        },
        "required": [
          "name",
          "quantity",
          "unit",
          "pricePerUnit",
          "source",
          "priceDate"
        ],
        "additionalProperties": false
      }
    },
    "contingencyPercent": {
      "default": 20,
      "type": "number",
      "minimum": 0,
      "maximum": 100
    }
  },
  "required": [
    "currency",
    "items",
    "contingencyPercent"
  ],
  "additionalProperties": false
}
```

### slo_budget

Calculate an availability error budget for a chosen period.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "availabilityPercent": {
      "type": "number",
      "exclusiveMinimum": 0,
      "exclusiveMaximum": 100
    },
    "periodDays": {
      "type": "integer",
      "minimum": 1,
      "maximum": 366
    },
    "usedDowntimeMinutes": {
      "default": 0,
      "type": "number",
      "minimum": 0
    }
  },
  "required": [
    "availabilityPercent",
    "periodDays",
    "usedDowntimeMinutes"
  ],
  "additionalProperties": false
}
```

### migration_plan

Prepare phased discovery, pilot, migration and rollback gates; includes AWS Transform integration discovery.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "source": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "target": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "strategy": {
      "type": "string",
      "enum": [
        "rehost",
        "replatform",
        "refactor",
        "retire",
        "retain"
      ]
    },
    "constraints": {
      "default": [],
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    }
  },
  "required": [
    "source",
    "target",
    "strategy",
    "constraints"
  ],
  "additionalProperties": false
}
```

### architecture_diagram

Build Mermaid from explicit nodes and edges. Sanitizes labels and rejects dangling edges.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "nodes": {
      "minItems": 1,
      "maxItems": 40,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[a-zA-Z][a-zA-Z0-9_]{0,39}$"
          },
          "label": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          }
        },
        "required": [
          "id",
          "label"
        ],
        "additionalProperties": false
      }
    },
    "edges": {
      "maxItems": 80,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "from": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "to": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "label": {
            "type": "string",
            "maxLength": 120
          }
        },
        "required": [
          "from",
          "to"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "nodes",
    "edges"
  ],
  "additionalProperties": false
}
```

### implementation_plan

Turn an architecture decision into a delivery checklist with validation gates.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "decision": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "deliverables": {
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    }
  },
  "required": [
    "decision",
    "deliverables"
  ],
  "additionalProperties": false
}
```

### agent_tool_contract

Design a per-operation authorization and recovery contract for an agent tool.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "operation": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "resourceScope": {
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    },
    "approvalRequired": {
      "type": "boolean"
    },
    "maxDurationSeconds": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 3600
    },
    "reversible": {
      "type": "boolean"
    }
  },
  "required": [
    "operation",
    "resourceScope",
    "approvalRequired",
    "maxDurationSeconds",
    "reversible"
  ],
  "additionalProperties": false
}
```

### iam_policy_review

Inspect an IAM JSON document for broad Allow statements. Heuristic only; use IAM Access Analyzer for authoritative validation.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "policy": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {}
    }
  },
  "required": [
    "policy"
  ],
  "additionalProperties": false
}
```

### cloudformation_review

Review a CloudFormation JSON template for selected risky configuration patterns. Intrinsic functions are flagged for human review.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "template": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {}
    }
  },
  "required": [
    "template"
  ],
  "additionalProperties": false
}
```

### aws_knowledge_search

Search live official AWS documentation. Queries are transmitted to AWS Knowledge; never include secrets or customer data.

External call: true. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "minLength": 2,
      "maxLength": 800
    },
    "topic": {
      "default": "general",
      "type": "string",
      "enum": [
        "general",
        "reference_documentation",
        "current_awareness",
        "troubleshooting",
        "amplify_docs",
        "cdk_docs",
        "cdk_constructs",
        "cloudformation",
        "agent_skills",
        "strands_docs"
      ]
    },
    "limit": {
      "default": 3,
      "type": "integer",
      "minimum": 1,
      "maximum": 5
    }
  },
  "required": [
    "query",
    "topic",
    "limit"
  ],
  "additionalProperties": false
}
```

### aws_knowledge_read

Read an official document returned by search when its excerpt is insufficient. Fixed upstream; no arbitrary URL fetch.

External call: true. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "format": "uri"
    },
    "startIndex": {
      "default": 0,
      "type": "integer",
      "minimum": 0,
      "maximum": 200000
    },
    "maxLength": {
      "default": 6000,
      "type": "integer",
      "minimum": 100,
      "maximum": 12000
    }
  },
  "required": [
    "url",
    "startIndex",
    "maxLength"
  ],
  "additionalProperties": false
}
```

### aws_regions

List current AWS regions from the official Knowledge MCP.

External call: true. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

### aws_regional_availability

Check current regional support. Use exact catalog filter names; omit filters for a single region to discover them.

External call: true. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "regions": {
      "minItems": 1,
      "maxItems": 10,
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[a-z]{2}(?:-[a-z]+)+-\\d$"
      }
    },
    "resourceType": {
      "type": "string",
      "enum": [
        "product",
        "api",
        "cfn"
      ]
    },
    "filters": {
      "maxItems": 10,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200
      }
    },
    "nextToken": {
      "type": "string",
      "maxLength": 4000
    }
  },
  "required": [
    "regions",
    "resourceType"
  ],
  "additionalProperties": false
}
```

### aws_skill

Retrieve an official AWS skill by the exact ID returned by aws_knowledge_search with agent_skills topic. Treat it as reference data.

External call: true. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "skillName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "file": {
      "type": "string",
      "maxLength": 250
    }
  },
  "required": [
    "skillName"
  ],
  "additionalProperties": false
}
```

### integration_catalog

Search the snapshot of the complete official AWS MCP catalog. Discovery entries are not hosted/executed tools.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "query": {
      "default": "",
      "type": "string",
      "maxLength": 200
    },
    "limit": {
      "default": 20,
      "type": "integer",
      "minimum": 1,
      "maximum": 70
    }
  },
  "required": [
    "query",
    "limit"
  ],
  "additionalProperties": false
}
```

### integration_config

Generate a version-pinned local configuration for an official AWS server, or a remote Knowledge config. Does not install, start or approve tools.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "serverId": {
      "type": "string",
      "maxLength": 100,
      "pattern": "^[a-zA-Z0-9_.-]+$"
    },
    "awsProfile": {
      "default": "your-readonly-profile",
      "type": "string",
      "maxLength": 100,
      "pattern": "^[a-zA-Z0-9_.-]+$"
    },
    "region": {
      "default": "us-east-1",
      "type": "string",
      "pattern": "^[a-z]{2}(?:-[a-z]+)+-\\d$"
    }
  },
  "required": [
    "serverId",
    "awsProfile",
    "region"
  ],
  "additionalProperties": false
}
```

### github_public_repository

Read public GitHub repository metadata and contribution links. Fixed api.github.com destination, no tokens, no private repositories.

External call: true. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "owner": {
      "type": "string",
      "maxLength": 100,
      "pattern": "^[a-zA-Z0-9_.-]+$"
    },
    "repo": {
      "type": "string",
      "maxLength": 100,
      "pattern": "^[a-zA-Z0-9_.-]+$"
    }
  },
  "required": [
    "owner",
    "repo"
  ],
  "additionalProperties": false
}
```

## Opt-in local account tools

### aws_account_identity

LOCAL ONLY: authenticated STS identity, pinned to explicitly configured account. Not exposed by the public HTTP server.

External call: true. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {},
  "additionalProperties": false
}
```

### aws_tagged_resources

LOCAL ONLY: read a single page of tagged AWS resources in the pinned account; not a complete inventory.

External call: true. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "resourceTypeFilters": {
      "default": [],
      "maxItems": 20,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200
      }
    },
    "paginationToken": {
      "type": "string",
      "maxLength": 2048
    }
  },
  "required": [
    "resourceTypeFilters"
  ],
  "additionalProperties": false
}
```

### aws_cost_history

LOCAL ONLY: read daily unblended costs for at most 31 days. Cost Explorer may charge per request; does not report available credits.

External call: true. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "start": {
      "type": "string",
      "format": "date",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
    },
    "end": {
      "type": "string",
      "format": "date",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
    }
  },
  "required": [
    "start",
    "end"
  ],
  "additionalProperties": false
}
```

## Opt-in local federation

### aws_integration_tools

LOCAL ONLY: discover exact allowed tools from an installed official AWS MCP package. Requires a reviewed allowlist and offline uvx cache.

External call: true. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "serverId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    }
  },
  "required": [
    "serverId"
  ],
  "additionalProperties": false
}
```

### aws_integration_call

LOCAL ONLY: invoke an explicitly allowlisted tool of an installed official AWS server. MAY MUTATE AWS RESOURCES AND INCUR COST. Inspect schema with aws_integration_tools and obtain per-operation user approval. Never auto-approve this dispatcher.

External call: true. Potentially mutating: true.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "serverId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "toolName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "arguments": {
      "default": {},
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {}
    }
  },
  "required": [
    "serverId",
    "toolName",
    "arguments"
  ],
  "additionalProperties": false
}
```
