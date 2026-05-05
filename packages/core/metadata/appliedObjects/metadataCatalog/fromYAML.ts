import { MetadataCatalog, MetadataCatalogYAML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { importPropertiesFromYAML } from "~/metadata/orchestration"
import { MetadataCatalogRules } from "./rules"

export const importMetadataCatalogFromYAML = (
  context: ConfigurationContext,
  data: MetadataCatalogYAML | undefined,
  name: string
): MetadataCatalog | undefined => {
  if (!data) return undefined

  const result = importPropertiesFromYAML({
    context,
    yaml: data,
    metadataRule: MetadataCatalogRules,
    name,
  })

  return {
    ...result,
    itemType: "MetadataCatalog",
    name,
  }
}
