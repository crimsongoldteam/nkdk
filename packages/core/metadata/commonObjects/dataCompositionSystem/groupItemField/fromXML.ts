import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromXML } from "~/metadata/orchestration/metadataItem/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { GroupItem } from "../structureItemGroup/types"
import { GroupItemAutoRules, GroupItemFieldRules } from "./rules"

const unwrapGroupItemsNode = (xml: unknown): unknown => {
  if (!xml || typeof xml !== "object") return undefined
  const obj = xml as Record<string, unknown>
  return obj["dcsset:item"]
}

const importGroupItemElementFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
) => {
  if (!xml || typeof xml !== "object") return undefined
  const xsiType = (xml as Record<string, unknown>)["_xsi:type"]
  if (typeof xsiType !== "string") return undefined
  if (xsiType === "dcsset:GroupItemField") {
    return importMetadataItemFromXML({ context, xml, rule: GroupItemFieldRules })
  }
  if (xsiType === "dcsset:GroupItemAuto") {
    return (
      importMetadataItemFromXML({ context, xml, rule: GroupItemAutoRules }) ?? {
        itemType: "GroupItemAuto",
      }
    )
  }
  return undefined
}

export const importGroupItemFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: unknown | undefined
): GroupItem | undefined => {
  if (xml === undefined || xml === null) return undefined
  const itemsXml = unwrapGroupItemsNode(xml)
  if (itemsXml === undefined) return undefined
  const items = Array.isArray(itemsXml) ? itemsXml : [itemsXml]
  const imported = items.flatMap((item) => {
    const importedItem = importGroupItemElementFromXML(context, rule, item)
    return importedItem ? [importedItem] : []
  })
  return imported.length > 0 ? imported : undefined
}
