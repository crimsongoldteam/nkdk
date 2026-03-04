import { MetadataCatalog, MetadataCatalogXML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { importPropertiesFromXML } from "~/metadata/metadataFactory"
import { MetadataCatalogRules } from "./rules"

export const importMetadataCatalogFromXML = (
  context: ConfigurationContext,
  xml: MetadataCatalogXML
): MetadataCatalog => {
  const result = importPropertiesFromXML<MetadataCatalog>({
    context,
    xml: xml,
    rule: MetadataCatalogRules,
  })!

  return {
    ...result,
    itemType: "MetadataCatalog",
  }
}
