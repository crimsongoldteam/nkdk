import { importMetadataItemFromXMLToYAML } from "../../../../../orchestration/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../../../../orchestration/property/importYamlTypes"
import { registerTypeRule } from "../../../../../orchestration/property/typeRuleRegistry"
import { GroupItemFieldRules } from "./rules"

export const importGroupItemFieldFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  name,
  traversal,
}) => {
  const yaml = importMetadataItemFromXMLToYAML({
    context,
    rule: GroupItemFieldRules,
    xml,
    name,
    traversal,
  })
  if (yaml === undefined || yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) return undefined

  const value = yaml as Record<string, unknown>
  if (typeof value.Поле !== "string") return undefined
  const keys = Object.keys(value)
  if (keys.length === 1) return value.Поле
  return value
}

registerTypeRule("GroupItemField", "importFromXMLToYAML", importGroupItemFieldFromXMLToYAML)
