# Tool reference

Generated from the registered schemas. Public tools are read-only; local provider calls may mutate resources. Use tools/list in your client for exact current schemas.

## Public HTTP / stdio

### architect_panel

Convene architect personas (solution, enterprise, business, data, infrastructure, software, AI, security, governance, FinOps) on a subject: each returns its questions, checks, deliverables and the workbench tools to call. Lens, not a verdict.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "subject": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "artifactType": {
      "type": "string",
      "enum": [
        "requirements",
        "design",
        "code",
        "iac",
        "api-contract",
        "data-model",
        "pipeline",
        "incident"
      ]
    },
    "roles": {
      "default": [
        "solution",
        "security",
        "finops"
      ],
      "minItems": 1,
      "maxItems": 10,
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "solution",
          "enterprise",
          "business",
          "data",
          "infrastructure",
          "software",
          "ai",
          "security",
          "governance",
          "finops"
        ]
      }
    },
    "knownFacts": {
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
    "subject",
    "artifactType",
    "roles",
    "knownFacts"
  ],
  "additionalProperties": false
}
```

### code_review_architecture

Heuristic architecture and security scan of source code pasted as text (any language): secrets, insecure calls, SQL built by concatenation, disabled TLS, hardcoded endpoints, missing timeouts and retry hazards. Not a linter or SAST replacement.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "filename": {
      "default": "snippet",
      "type": "string",
      "maxLength": 200
    },
    "language": {
      "default": "auto",
      "type": "string",
      "enum": [
        "auto",
        "typescript",
        "javascript",
        "python",
        "java",
        "go",
        "csharp",
        "kotlin",
        "ruby",
        "php",
        "rust",
        "shell",
        "yaml",
        "json",
        "hcl",
        "sql"
      ]
    },
    "code": {
      "type": "string",
      "minLength": 1,
      "maxLength": 60000
    }
  },
  "required": [
    "filename",
    "language",
    "code"
  ],
  "additionalProperties": false
}
```

### dependency_manifest_review

Review a dependency manifest (package.json, requirements.txt, pyproject, go.mod, pom.xml, Gemfile, Cargo.toml as text) for unpinned ranges, git or URL sources, wildcard versions and missing lockfile hints.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "filename": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "content": {
      "type": "string",
      "minLength": 1,
      "maxLength": 60000
    },
    "lockfilePresent": {
      "type": "boolean"
    }
  },
  "required": [
    "filename",
    "content"
  ],
  "additionalProperties": false
}
```

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

Select a reference architecture by explicit workload pattern; returns tradeoffs, questions and Mermaid. provider maps the AWS services to Azure, GCP, OCI or open source equivalents.

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
    },
    "provider": {
      "default": "aws",
      "type": "string",
      "enum": [
        "aws",
        "azure",
        "gcp",
        "oci",
        "oss"
      ]
    }
  },
  "required": [
    "pattern",
    "workload",
    "provider"
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

### c4_model

Build C4 context or container diagrams (Mermaid) from explicit people, systems, containers and relations. Validates endpoints; no infrastructure discovery.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "level": {
      "type": "string",
      "enum": [
        "context",
        "container"
      ]
    },
    "system": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "people": {
      "default": [],
      "maxItems": 15,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[a-zA-Z][a-zA-Z0-9_]{0,39}$"
          },
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "description": {
            "default": "",
            "type": "string",
            "maxLength": 200
          },
          "technology": {
            "type": "string",
            "maxLength": 80
          }
        },
        "required": [
          "id",
          "name",
          "description"
        ],
        "additionalProperties": false
      }
    },
    "externalSystems": {
      "default": [],
      "maxItems": 20,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[a-zA-Z][a-zA-Z0-9_]{0,39}$"
          },
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "description": {
            "default": "",
            "type": "string",
            "maxLength": 200
          },
          "technology": {
            "type": "string",
            "maxLength": 80
          }
        },
        "required": [
          "id",
          "name",
          "description"
        ],
        "additionalProperties": false
      }
    },
    "containers": {
      "default": [],
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^[a-zA-Z][a-zA-Z0-9_]{0,39}$"
          },
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "description": {
            "default": "",
            "type": "string",
            "maxLength": 200
          },
          "technology": {
            "type": "string",
            "maxLength": 80
          }
        },
        "required": [
          "id",
          "name",
          "description"
        ],
        "additionalProperties": false
      }
    },
    "relations": {
      "default": [],
      "maxItems": 80,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "from": {
            "type": "string",
            "pattern": "^[a-zA-Z][a-zA-Z0-9_]{0,39}$"
          },
          "to": {
            "type": "string",
            "pattern": "^[a-zA-Z][a-zA-Z0-9_]{0,39}$"
          },
          "label": {
            "default": "uses",
            "type": "string",
            "maxLength": 120
          },
          "technology": {
            "type": "string",
            "maxLength": 80
          }
        },
        "required": [
          "from",
          "to",
          "label"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "level",
    "system",
    "people",
    "externalSystems",
    "containers",
    "relations"
  ],
  "additionalProperties": false
}
```

### sequence_diagram

Build a Mermaid sequence diagram from participants and ordered messages, with optional activation, notes and alt/loop blocks. Rejects unknown participants.

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
    "participants": {
      "minItems": 2,
      "maxItems": 15,
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
          },
          "kind": {
            "default": "participant",
            "type": "string",
            "enum": [
              "actor",
              "participant"
            ]
          }
        },
        "required": [
          "id",
          "label",
          "kind"
        ],
        "additionalProperties": false
      }
    },
    "messages": {
      "minItems": 1,
      "maxItems": 60,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "from": {
            "type": "string",
            "pattern": "^[a-zA-Z][a-zA-Z0-9_]{0,39}$"
          },
          "to": {
            "type": "string",
            "pattern": "^[a-zA-Z][a-zA-Z0-9_]{0,39}$"
          },
          "text": {
            "type": "string",
            "minLength": 1,
            "maxLength": 140
          },
          "style": {
            "default": "sync",
            "type": "string",
            "enum": [
              "sync",
              "async",
              "reply",
              "reply-async"
            ]
          },
          "activate": {
            "default": false,
            "type": "boolean"
          },
          "note": {
            "type": "string",
            "maxLength": 140
          },
          "block": {
            "type": "object",
            "properties": {
              "kind": {
                "type": "string",
                "enum": [
                  "alt",
                  "else",
                  "loop",
                  "opt",
                  "par",
                  "end"
                ]
              },
              "label": {
                "default": "",
                "type": "string",
                "maxLength": 80
              }
            },
            "required": [
              "kind",
              "label"
            ],
            "additionalProperties": false
          }
        },
        "required": [
          "from",
          "to",
          "text",
          "style",
          "activate"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "title",
    "participants",
    "messages"
  ],
  "additionalProperties": false
}
```

### service_equivalents

Map a cloud capability to equivalent managed services on AWS, Azure, Google Cloud, OCI and open source. Names as of the snapshot date; verify current naming, regions and pricing before deciding.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "categories": {
      "maxItems": 40,
      "type": "array",
      "items": {
        "type": "string",
        "maxLength": 60
      }
    },
    "from": {
      "default": "aws",
      "type": "string",
      "enum": [
        "aws",
        "azure",
        "gcp",
        "oci",
        "oss"
      ]
    },
    "to": {
      "default": [
        "azure",
        "gcp",
        "oci",
        "oss"
      ],
      "minItems": 1,
      "maxItems": 5,
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "aws",
          "azure",
          "gcp",
          "oci",
          "oss"
        ]
      }
    },
    "query": {
      "type": "string",
      "maxLength": 100
    }
  },
  "required": [
    "from",
    "to"
  ],
  "additionalProperties": false
}
```

### data_classification

Classify data elements, map them to regulation hints (LGPD, GDPR, PCI DSS, HIPAA) and list handling controls and open questions. Review aid, not legal advice.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "system": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "elements": {
      "minItems": 1,
      "maxItems": 60,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "category": {
            "type": "string",
            "enum": [
              "public",
              "internal",
              "personal",
              "sensitive-personal",
              "financial-card",
              "health",
              "credential",
              "children"
            ]
          },
          "purpose": {
            "default": "",
            "type": "string",
            "maxLength": 200
          },
          "retentionDays": {
            "type": "integer",
            "minimum": 0,
            "maximum": 36500
          },
          "residency": {
            "type": "string",
            "maxLength": 60
          },
          "sharedWith": {
            "default": [],
            "maxItems": 10,
            "type": "array",
            "items": {
              "type": "string",
              "minLength": 1,
              "maxLength": 200
            }
          }
        },
        "required": [
          "name",
          "category",
          "purpose",
          "sharedWith"
        ],
        "additionalProperties": false
      }
    },
    "jurisdictions": {
      "default": [
        "BR"
      ],
      "minItems": 1,
      "maxItems": 4,
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "BR",
          "EU",
          "US",
          "other"
        ]
      }
    }
  },
  "required": [
    "system",
    "elements",
    "jurisdictions"
  ],
  "additionalProperties": false
}
```

### openapi_review

Heuristic review of an OpenAPI 3.x document (JSON): security, pagination, error responses, idempotency, versioning and documentation gaps. Not a linter replacement.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "document": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {}
    }
  },
  "required": [
    "document"
  ],
  "additionalProperties": false
}
```

### event_contract

Design an event contract: envelope fields, schema evolution rules, idempotency, ordering, DLQ and replay decisions for a named business event. Deterministic template with open questions.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "eventName": {
      "type": "string",
      "pattern": "^[A-Za-z][A-Za-z0-9]*(\\.[A-Za-z][A-Za-z0-9]*)+$"
    },
    "producer": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "consumers": {
      "minItems": 1,
      "maxItems": 20,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200
      }
    },
    "payloadFields": {
      "minItems": 1,
      "maxItems": 60,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "type": {
            "type": "string",
            "enum": [
              "string",
              "number",
              "integer",
              "boolean",
              "timestamp",
              "object",
              "array",
              "id",
              "money"
            ]
          },
          "required": {
            "default": true,
            "type": "boolean"
          },
          "pii": {
            "default": false,
            "type": "boolean"
          }
        },
        "required": [
          "name",
          "type",
          "required",
          "pii"
        ],
        "additionalProperties": false
      }
    },
    "ordering": {
      "default": "per-key",
      "type": "string",
      "enum": [
        "none",
        "per-key",
        "global"
      ]
    },
    "deliveryGuarantee": {
      "default": "at-least-once",
      "type": "string",
      "enum": [
        "at-least-once",
        "at-most-once",
        "effectively-once"
      ]
    }
  },
  "required": [
    "eventName",
    "producer",
    "consumers",
    "payloadFields",
    "ordering",
    "deliveryGuarantee"
  ],
  "additionalProperties": false
}
```

### latency_budget

Split an end-to-end latency objective across hops and show which hops exceed their share. Pure arithmetic over caller-supplied estimates.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "targetMs": {
      "type": "number",
      "exclusiveMinimum": 0,
      "maximum": 600000
    },
    "percentile": {
      "default": "p95",
      "type": "string",
      "enum": [
        "p50",
        "p95",
        "p99"
      ]
    },
    "hops": {
      "minItems": 1,
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "estimatedMs": {
            "type": "number",
            "minimum": 0,
            "maximum": 600000
          },
          "parallelGroup": {
            "type": "string",
            "maxLength": 40
          },
          "cacheable": {
            "default": false,
            "type": "boolean"
          }
        },
        "required": [
          "name",
          "estimatedMs",
          "cacheable"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "targetMs",
    "percentile",
    "hops"
  ],
  "additionalProperties": false
}
```

### queue_sizing

Size consumers for a queue with Little's law and Erlang C: utilization, wait probability, backlog drain time and consumers needed for a target utilization.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "arrivalsPerSecond": {
      "type": "number",
      "exclusiveMinimum": 0,
      "maximum": 10000000
    },
    "serviceTimeMs": {
      "type": "number",
      "exclusiveMinimum": 0,
      "maximum": 3600000
    },
    "consumers": {
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 100000
    },
    "backlogMessages": {
      "default": 0,
      "type": "number",
      "minimum": 0,
      "maximum": 1000000000000
    },
    "targetUtilizationPercent": {
      "default": 70,
      "type": "number",
      "minimum": 10,
      "maximum": 95
    },
    "maxConcurrencyPerConsumer": {
      "default": 1,
      "type": "integer",
      "exclusiveMinimum": 0,
      "maximum": 10000
    }
  },
  "required": [
    "arrivalsPerSecond",
    "serviceTimeMs",
    "consumers",
    "backlogMessages",
    "targetUtilizationPercent",
    "maxConcurrencyPerConsumer"
  ],
  "additionalProperties": false
}
```

### dr_strategy

Compare disaster recovery tiers (backup-and-restore, pilot light, warm standby, active-active) against RTO, RPO and data constraints; returns feasible tiers and required capabilities, not a guarantee.

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
    "rtoMinutes": {
      "type": "number",
      "exclusiveMinimum": 0,
      "maximum": 10080
    },
    "rpoMinutes": {
      "type": "number",
      "minimum": 0,
      "maximum": 10080
    },
    "dataGB": {
      "default": 0,
      "type": "number",
      "minimum": 0,
      "maximum": 1000000000
    },
    "replicationBandwidthMbps": {
      "type": "number",
      "exclusiveMinimum": 0,
      "maximum": 1000000
    },
    "regulatoryResidency": {
      "type": "string",
      "maxLength": 80
    },
    "statefulComponents": {
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
    "rtoMinutes",
    "rpoMinutes",
    "dataGB",
    "statefulComponents"
  ],
  "additionalProperties": false
}
```

### retry_policy

Compute an exponential backoff schedule with jitter, the worst-case wait and whether it fits a deadline; adds idempotency and circuit-breaker guidance.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "baseDelayMs": {
      "default": 100,
      "type": "number",
      "exclusiveMinimum": 0,
      "maximum": 60000
    },
    "factor": {
      "default": 2,
      "type": "number",
      "minimum": 1,
      "maximum": 10
    },
    "capMs": {
      "default": 20000,
      "type": "number",
      "exclusiveMinimum": 0,
      "maximum": 600000
    },
    "maxAttempts": {
      "default": 5,
      "type": "integer",
      "minimum": 1,
      "maximum": 20
    },
    "jitter": {
      "default": "full",
      "type": "string",
      "enum": [
        "none",
        "full",
        "equal"
      ]
    },
    "deadlineMs": {
      "type": "number",
      "exclusiveMinimum": 0,
      "maximum": 3600000
    },
    "operationIdempotent": {
      "type": "boolean"
    }
  },
  "required": [
    "baseDelayMs",
    "factor",
    "capMs",
    "maxAttempts",
    "jitter",
    "operationIdempotent"
  ],
  "additionalProperties": false
}
```

### storage_growth

Project storage volume and relative cost over time from ingest, retention, compression, replication and growth; suggests tiering thresholds.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "dailyIngestGB": {
      "type": "number",
      "minimum": 0,
      "maximum": 1000000000
    },
    "retentionDays": {
      "type": "integer",
      "minimum": 1,
      "maximum": 36500
    },
    "monthlyGrowthPercent": {
      "default": 0,
      "type": "number",
      "minimum": -50,
      "maximum": 100
    },
    "compressionRatio": {
      "default": 1,
      "type": "number",
      "minimum": 1,
      "maximum": 100
    },
    "replicationFactor": {
      "default": 1,
      "type": "number",
      "minimum": 1,
      "maximum": 10
    },
    "months": {
      "default": 24,
      "type": "integer",
      "minimum": 1,
      "maximum": 120
    },
    "hotTierPricePerGBMonth": {
      "type": "number",
      "minimum": 0,
      "maximum": 1000
    },
    "coldTierPricePerGBMonth": {
      "type": "number",
      "minimum": 0,
      "maximum": 1000
    },
    "hotDays": {
      "default": 30,
      "type": "integer",
      "minimum": 0,
      "maximum": 36500
    }
  },
  "required": [
    "dailyIngestGB",
    "retentionDays",
    "monthlyGrowthPercent",
    "compressionRatio",
    "replicationFactor",
    "months",
    "hotDays"
  ],
  "additionalProperties": false
}
```

### finops_unit_economics

Compute cost per unit (request, customer, transaction), fixed versus variable split and the volume at which the marginal cost crosses a target. Caller supplies costs; no provider prices are guessed.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "period": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "currency": {
      "default": "USD",
      "type": "string",
      "enum": [
        "USD",
        "BRL",
        "EUR"
      ]
    },
    "fixedCosts": {
      "default": [],
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
          "amount": {
            "type": "number",
            "minimum": 0,
            "maximum": 1000000000000
          }
        },
        "required": [
          "name",
          "amount"
        ],
        "additionalProperties": false
      }
    },
    "variableCosts": {
      "default": [],
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
          "amount": {
            "type": "number",
            "minimum": 0,
            "maximum": 1000000000000
          }
        },
        "required": [
          "name",
          "amount"
        ],
        "additionalProperties": false
      }
    },
    "units": {
      "minItems": 1,
      "maxItems": 10,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "count": {
            "type": "number",
            "exclusiveMinimum": 0,
            "maximum": 1000000000000000
          }
        },
        "required": [
          "name",
          "count"
        ],
        "additionalProperties": false
      }
    },
    "targetCostPerPrimaryUnit": {
      "type": "number",
      "exclusiveMinimum": 0,
      "maximum": 1000000000
    }
  },
  "required": [
    "period",
    "currency",
    "fixedCosts",
    "variableCosts",
    "units"
  ],
  "additionalProperties": false
}
```

### postmortem

Generate a blameless postmortem document from incident facts: timeline, impact, detection, contributing factors and owned action items. Rejects action items without owner and due date.

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
    "severity": {
      "type": "string",
      "enum": [
        "sev1",
        "sev2",
        "sev3",
        "sev4"
      ]
    },
    "startedAt": {
      "type": "string",
      "format": "date-time",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"
    },
    "detectedAt": {
      "type": "string",
      "format": "date-time",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"
    },
    "mitigatedAt": {
      "type": "string",
      "format": "date-time",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"
    },
    "resolvedAt": {
      "type": "string",
      "format": "date-time",
      "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"
    },
    "impact": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "timeline": {
      "minItems": 2,
      "maxItems": 60,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "at": {
            "type": "string",
            "format": "date-time",
            "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))T(?:(?:[01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d(?:\\.\\d+)?(?:Z))$"
          },
          "event": {
            "type": "string",
            "minLength": 1,
            "maxLength": 300
          }
        },
        "required": [
          "at",
          "event"
        ],
        "additionalProperties": false
      }
    },
    "contributingFactors": {
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    },
    "whatWentWell": {
      "default": [],
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    },
    "actionItems": {
      "minItems": 1,
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "action": {
            "type": "string",
            "minLength": 1,
            "maxLength": 300
          },
          "owner": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "due": {
            "type": "string",
            "format": "date",
            "pattern": "^(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))$"
          },
          "kind": {
            "type": "string",
            "enum": [
              "prevent",
              "detect",
              "mitigate",
              "process"
            ]
          }
        },
        "required": [
          "action",
          "owner",
          "due",
          "kind"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "title",
    "severity",
    "startedAt",
    "detectedAt",
    "mitigatedAt",
    "resolvedAt",
    "impact",
    "timeline",
    "contributingFactors",
    "whatWentWell",
    "actionItems"
  ],
  "additionalProperties": false
}
```

### runbook

Generate an operational runbook from service facts: alerts, diagnostic steps, remediation, rollback, escalation and verification. Template with explicit placeholders for what the caller did not provide.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "service": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "owner": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "alerts": {
      "minItems": 1,
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "meaning": {
            "type": "string",
            "minLength": 1,
            "maxLength": 300
          },
          "threshold": {
            "type": "string",
            "maxLength": 120
          }
        },
        "required": [
          "name",
          "meaning"
        ],
        "additionalProperties": false
      }
    },
    "diagnostics": {
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    },
    "remediation": {
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    },
    "rollback": {
      "default": [],
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    },
    "escalation": {
      "default": [],
      "maxItems": 30,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 4000
      }
    },
    "dashboards": {
      "default": [],
      "maxItems": 10,
      "type": "array",
      "items": {
        "type": "string",
        "format": "uri"
      }
    }
  },
  "required": [
    "service",
    "owner",
    "alerts",
    "diagnostics",
    "remediation",
    "rollback",
    "escalation",
    "dashboards"
  ],
  "additionalProperties": false
}
```

### agent_eval_plan

Design an evaluation plan for an AI agent: golden set sizing, metrics, judge rubric, red-team cases and regression cadence from explicit capabilities and risks.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "agent": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "capabilities": {
      "minItems": 1,
      "maxItems": 20,
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 200
      }
    },
    "tools": {
      "default": [],
      "maxItems": 40,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "mutating": {
            "type": "boolean"
          }
        },
        "required": [
          "name",
          "mutating"
        ],
        "additionalProperties": false
      }
    },
    "risks": {
      "minItems": 1,
      "maxItems": 7,
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "wrong-action",
          "data-leak",
          "prompt-injection",
          "cost-runaway",
          "hallucinated-fact",
          "bias",
          "latency"
        ]
      }
    },
    "releaseCadence": {
      "default": "weekly",
      "type": "string",
      "enum": [
        "daily",
        "weekly",
        "monthly"
      ]
    }
  },
  "required": [
    "agent",
    "capabilities",
    "tools",
    "risks",
    "releaseCadence"
  ],
  "additionalProperties": false
}
```

### prompt_injection_checklist

Enumerate injection paths and controls for an agent from its tools and untrusted data sources; produces a checklist with status to fill, not a scan.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "agent": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "untrustedSources": {
      "minItems": 1,
      "maxItems": 8,
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "web-pages",
          "documents",
          "emails",
          "tickets",
          "database-rows",
          "tool-results",
          "user-uploads",
          "other-agents"
        ]
      }
    },
    "tools": {
      "minItems": 1,
      "maxItems": 40,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 200
          },
          "mutating": {
            "type": "boolean"
          },
          "external": {
            "default": false,
            "type": "boolean"
          }
        },
        "required": [
          "name",
          "mutating",
          "external"
        ],
        "additionalProperties": false
      }
    },
    "humanInLoop": {
      "type": "boolean"
    }
  },
  "required": [
    "agent",
    "untrustedSources",
    "tools",
    "humanInLoop"
  ],
  "additionalProperties": false
}
```

### rag_pipeline_plan

Plan a retrieval-augmented generation pipeline from corpus facts: chunking, embedding, indexing, authorization, evaluation and cost drivers, with open questions. No vendor is chosen for you.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "useCase": {
      "type": "string",
      "minLength": 1,
      "maxLength": 4000
    },
    "corpus": {
      "type": "object",
      "properties": {
        "documents": {
          "type": "integer",
          "exclusiveMinimum": 0,
          "maximum": 1000000000
        },
        "averagePages": {
          "default": 10,
          "type": "number",
          "exclusiveMinimum": 0,
          "maximum": 10000
        },
        "formats": {
          "minItems": 1,
          "maxItems": 8,
          "type": "array",
          "items": {
            "type": "string",
            "enum": [
              "pdf",
              "html",
              "markdown",
              "docx",
              "code",
              "tables",
              "images",
              "transcripts"
            ]
          }
        },
        "updateFrequency": {
          "type": "string",
          "enum": [
            "static",
            "daily",
            "hourly",
            "realtime"
          ]
        },
        "languages": {
          "default": [
            "pt-BR"
          ],
          "minItems": 1,
          "maxItems": 10,
          "type": "array",
          "items": {
            "type": "string",
            "maxLength": 10
          }
        }
      },
      "required": [
        "documents",
        "averagePages",
        "formats",
        "updateFrequency",
        "languages"
      ],
      "additionalProperties": false
    },
    "authorization": {
      "type": "string",
      "enum": [
        "public",
        "single-tenant",
        "multi-tenant",
        "per-document-acl"
      ]
    },
    "latencyBudgetMs": {
      "default": 3000,
      "type": "number",
      "exclusiveMinimum": 0,
      "maximum": 60000
    },
    "citationsRequired": {
      "default": true,
      "type": "boolean"
    }
  },
  "required": [
    "useCase",
    "corpus",
    "authorization",
    "latencyBudgetMs",
    "citationsRequired"
  ],
  "additionalProperties": false
}
```

### mcp_server_review

Heuristic safety review of ANOTHER MCP server from its tools/list output: tool-poisoning text, missing annotations, risky parameters, free-form schemas, name shadowing and context cost. Paste the JSON your client shows.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "serverName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 200
    },
    "tools": {
      "minItems": 1,
      "maxItems": 300,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {
            "type": "string",
            "minLength": 1,
            "maxLength": 120
          },
          "description": {
            "type": "string",
            "maxLength": 5000
          },
          "inputSchema": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {}
          },
          "annotations": {
            "type": "object",
            "propertyNames": {
              "type": "string"
            },
            "additionalProperties": {}
          }
        },
        "required": [
          "name"
        ],
        "additionalProperties": false
      }
    }
  },
  "required": [
    "serverName",
    "tools"
  ],
  "additionalProperties": false
}
```

### mcp_config_review

Review an MCP client configuration JSON (mcpServers map) for unpinned packages, inline secrets, plain HTTP, auto-approved tools and unreviewed enablement.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "config": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {}
    }
  },
  "required": [
    "config"
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

### terraform_plan_review

Review a Terraform or OpenTofu plan exported as JSON (terraform show -json): deletions and replacements of stateful resources, public exposure, disabled encryption, literal credentials, broad policies and unpinned providers. Any provider; heuristic.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "plan": {
      "type": "object",
      "propertyNames": {
        "type": "string"
      },
      "additionalProperties": {}
    }
  },
  "required": [
    "plan"
  ],
  "additionalProperties": false
}
```

### kubernetes_manifest_review

Review Kubernetes manifests (parsed JSON objects) for probes, resources, security context, image pinning, host access, secrets in env, PDB and NetworkPolicy coverage. No cluster access.

External call: false. Potentially mutating: false.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "manifests": {
      "minItems": 1,
      "maxItems": 300,
      "type": "array",
      "items": {
        "type": "object",
        "propertyNames": {
          "type": "string"
        },
        "additionalProperties": {}
      }
    }
  },
  "required": [
    "manifests"
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
