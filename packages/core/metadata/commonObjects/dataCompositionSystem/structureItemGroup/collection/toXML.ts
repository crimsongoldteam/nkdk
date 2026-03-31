import { ConfigurationContextWithExportToXML } from "~/metadata/context/types"
import { exportPropertyToXML, PropertyRule, registerTypeRule } from "~/metadata/orchestration"
import { StructureItemGroupRegistry } from "./registry"
import { StructureItemGroupCollection, StructureItemGroupCollectionItem } from "./types"

type ToXMLParams = {
  context: ConfigurationContextWithExportToXML
  rule: PropertyRule
  value: unknown
  referenceMetadata?: unknown
}

export const exportStructureItemGroupCollectionToXML = ({
  context,
  value,
  // referenceMetadata,
}: ToXMLParams): unknown => {
  if (!value || !Array.isArray(value) || value.length === 0) return undefined

  const items = value as StructureItemGroupCollection
  // const referenceItems = Array.isArray(referenceMetadata) ? (referenceMetadata as StructureItemGroupCollection) : []
  const result: Record<string, unknown>[] = []

  for (let index = 0; index < items.length; index++) {
    const item = items[index]!
    const registryItem = findStructureItemGroupRegistryItemByItemType(item.itemType)
    if (!registryItem) continue
    // const referenceItem = referenceItems[index]

    const converted = exportPropertyToXML({
      context,
      rule: { type: registryItem.itemType } as PropertyRule,
      value: item,
      // referenceMetadata: referenceItem,
      metadataItem: item,
    })
    if (converted) result.push(converted as Record<string, unknown>)
  }

  return result.length > 0 ? result : undefined
}

const findStructureItemGroupRegistryItemByItemType = (itemType: StructureItemGroupCollectionItem["itemType"]) =>
  StructureItemGroupRegistry.find((item) => item.itemType === itemType)

registerTypeRule("StructureItemGroupCollection", "exportToXML", exportStructureItemGroupCollectionToXML)
