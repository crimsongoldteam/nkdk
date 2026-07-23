import { importMetadataItemFromXMLToYAML } from "../../../../../orchestration/metadataItem/fromXMLToYAML"
import type { ImportFromXMLToYAMLFunction } from "../../../../../orchestration/property/importYamlTypes"
import { registerTypeRule } from "../../../../../orchestration/property/typeRuleRegistry"
import { GroupItemAutoRules } from "./rules"

export const importGroupItemAutoFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  name,
  traversal,
}) => {
  const yaml = importMetadataItemFromXMLToYAML({
    context,
    rule: GroupItemAutoRules,
    xml,
    name,
    traversal,
  })
  if (yaml === undefined || yaml === null || typeof yaml !== "object" || Array.isArray(yaml)) return undefined

  return (yaml as Record<string, unknown>).Использование === "Ложь" ? "([Авто])" : "[Авто]"
}

registerTypeRule("GroupItemAuto", "importFromXMLToYAML", importGroupItemAutoFromXMLToYAML)
