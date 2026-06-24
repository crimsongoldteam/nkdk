import { MetadataCatalog, MetadataCatalogYAML } from "~/metadata/appliedObjects/metadataCatalog/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { MetadataCatalogRules } from "./rules"

export const importMetadataCatalogFromYAML = (
  context: ConfigurationContext,
  data: MetadataCatalogYAML | undefined,
  name: string
): MetadataCatalog | undefined => {
  if (!data) return undefined

  const result = importMetadataItemFromYAML({
    context,
    yaml: data,
    rule: MetadataCatalogRules,
    name,
  })

  if (result == undefined) return undefined

  return {
    ...result,
    name,
  }
}
