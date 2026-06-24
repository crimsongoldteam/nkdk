import type { BasePropertyRule } from "~/metadata/orchestration"

export interface WSDefinitionSchemasPropertyRule extends BasePropertyRule {
  type: "WSDefinitionSchemas"
  syncExternalOnly: true
}
