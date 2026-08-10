import type { ImportFromXMLToYAMLFunction } from "@nkdk/runtime/rule-kit"
import { getTypeRule, definePropertyTypeRule } from "../../../../ruleRuntime/property/typeRuleRegistry"
import type { MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { GroupItemAutoRules } from "../items/groupItemAuto/rules"
import { GroupItemFieldRules } from "../items/groupItemField/rules"
import { withConfigurationIndexYamlCollectionItemContext } from "@nkdk/runtime"

const itemRules = [GroupItemAutoRules, GroupItemFieldRules] as const

export const importStructureItemGroupCollectionFromXMLToYAML: ImportFromXMLToYAMLFunction = ({
  context,
  xml,
  name,
  traversal,
}) => {
  const result: unknown[] = []
  for (const [index, item] of asArray(xml).entries()) {
    const rule = findItemRule(item)
    if (rule === undefined) continue
    const direct = getTypeRule(rule.itemType, "importFromXMLToYAML")
    if (direct === undefined) continue
    const yaml = direct({
      context: withConfigurationIndexYamlCollectionItemContext(context, { index, yamlAsArray: true }),
      rule: { type: rule.itemType },
      xml: item,
      name,
      traversal: { ...traversal, yamlPath: [...traversal.yamlPath, index] },
    })
    if (yaml !== undefined) result.push(yaml)
  }
  return result.length === 0 ? undefined : result
}

function findItemRule(xml: unknown): MetadataItemRule | undefined {
  if (xml === null || typeof xml !== "object" || Array.isArray(xml)) return undefined
  const xsiType = (xml as Record<string, unknown>)["_xsi:type"]
  return itemRules.find((rule) => rule.xsiType === xsiType)
}

function asArray(value: unknown): unknown[] {
  if (value === undefined) return []
  return Array.isArray(value) ? value : [value]
}

export const metadataPropertyRule000 = definePropertyTypeRule(
  "StructureItemGroupCollection",
  "importFromXMLToYAML",
  importStructureItemGroupCollectionFromXMLToYAML
)
