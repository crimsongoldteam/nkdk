import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertyToYAML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import type { StructureItemGroupCollection, StructureItemGroupCollectionYAML } from "./types"

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

    if (typeof converted === "string") result.push(converted)
  }

  return result.length > 0 ? result : undefined
}

registerTypeRule("StructureItemGroupCollectionItem", "exportToYAML", exportStructureItemGroupCollectionToYAML)
