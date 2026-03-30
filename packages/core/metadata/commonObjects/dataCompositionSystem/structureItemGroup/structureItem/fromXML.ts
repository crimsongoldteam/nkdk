import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importMetadataItemFromXML } from "~/metadata/orchestration/metadataItem/fromXML"
import { PropertyRule } from "~/metadata/orchestration/property/types"
import { StructureItem } from "./types"
import { StructureItemGroupRules } from "../rules"

const importStructureItemElementFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: unknown
) => {
  if (!xml || typeof xml !== "object") return undefined
  const xsiType = (xml as Record<string, unknown>)["_xsi:type"]
  if (typeof xsiType !== "string") return undefined
  if (xsiType === "dcsset:StructureItemGroup") {
    return importMetadataItemFromXML({ context, xml, rule: StructureItemGroupRules })
  }
  return undefined
}

export const importStructureItemFromXML = (
  context: ConfigurationContextFromXML,
  rule: PropertyRule | undefined,
  xml: unknown | unknown[] | undefined
): StructureItem | undefined => {
  if (!xml) return undefined
  const items = Array.isArray(xml) ? xml : [xml]
  const imported = items.flatMap((item) => {
    const importedItem = importStructureItemElementFromXML(context, rule, item)
    return importedItem ? [importedItem] : []
  })
  return imported.length > 0 ? imported : undefined
}
