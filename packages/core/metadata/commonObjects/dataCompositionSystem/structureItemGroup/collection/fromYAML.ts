import { ConfigurationContext } from "../../../../context/types"
import { callAtomicFromYAML, PropertyRule, registerTypeRule } from "../../../../orchestration"
import { StructureItemGroupRegistry } from "./registry"
import {
  StructureItemGroupCollection,
  StructureItemGroupCollectionItemYAML,
  StructureItemGroupCollectionYAML,
} from "./types"

export const importStructureItemGroupCollectionFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule,
  value: unknown
): StructureItemGroupCollection | undefined => {
  if (!value || !Array.isArray(value)) return undefined

  const result: StructureItemGroupCollection = []

  for (const item of value as StructureItemGroupCollectionYAML) {
    const registryItem = findStructureItemGroupRegistryItemByYAML(item)
    if (!registryItem) continue

    const converted = callAtomicFromYAML({
      context,
      rule: { type: registryItem.itemType } as PropertyRule,
      value: item,
    })
    if (converted) result.push(converted)
  }

  return result.length > 0 ? result : undefined
}

const findStructureItemGroupRegistryItemByYAML = (yaml: StructureItemGroupCollectionItemYAML) =>
  StructureItemGroupRegistry.find((item) => item.detectYAML(yaml))

registerTypeRule("StructureItemGroupCollection", "importFromYAML", importStructureItemGroupCollectionFromYAML)
