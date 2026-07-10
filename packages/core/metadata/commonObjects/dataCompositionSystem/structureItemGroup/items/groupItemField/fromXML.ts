import { ConfigurationContextFromXML } from "../../../../../context/types"
import { registerTypeRule } from "../../../../../orchestration/property/typeRuleRegistry"
import { importMetadataItemFromXML } from "../../../../../orchestration/metadataItem/fromXML"
import type { PropertyRule } from "../../../../../orchestration/property/types"
import { GroupItemFieldRules } from "./rules"
import type { GroupItemField } from "./types"

export const importGroupItemFieldFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule,
  xml: unknown
): GroupItemField | undefined => {
  if (!xml || typeof xml !== "object") return undefined
  return importMetadataItemFromXML({ context, rule: GroupItemFieldRules, xml })
}

registerTypeRule("GroupItemField", "importFromXML", importGroupItemFieldFromXML as any)
