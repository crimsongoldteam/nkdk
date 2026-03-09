import { MetadataCatalog, MetadataCatalogXML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importPropertiesFromXML } from "~/metadata/orchestration"
import { MetadataCatalogRules } from "./rules"

export const importMetadataCatalogFromXML = (
  context: ConfigurationContextFromXML,
  xml: MetadataCatalogXML
): MetadataCatalog => {
  const result = importPropertiesFromXML({
    context,
    xml: xml,
    rule: MetadataCatalogRules,
  })

  if (!result) throw new Error("Failed to import MetadataCatalog from XML")

  return {
    ...result,
    itemType: "MetadataCatalog",
  }
}
