import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertyToYAML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { StructureItemGroupCollectionItemYAML, StructureItemGroupCollectionYAML, StructureItemGroupCollection } from "./types"

export const exportStructureItemGroupCollectionToYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: unknown
): StructureItemGroupCollectionYAML | undefined => {
  if (!value || !Array.isArray(value) || value.length === 0) return undefined

  const result: StructureItemGroupCollectionYAML = []

  for (const item of value as StructureItemGroupCollection) {
    const convertedWithTempKey = exportPropertyToYAML({
      context,
      // exportPropertyToYAML requires yaml-keyed property rule.
      // Collection needs raw item YAML, so we unwrap temporary key below.
      rule: { type: item.itemType, yaml: "__item__" } as PropertyRule,
      value: item,
    })
    const converted = convertedWithTempKey?.__item__

    if (converted != null) result.push(converted as StructureItemGroupCollectionItemYAML)
  }

  return result.length > 0 ? result : undefined
}

registerTypeRule("StructureItemGroupCollection", "exportToYAML", exportStructureItemGroupCollectionToYAML)
