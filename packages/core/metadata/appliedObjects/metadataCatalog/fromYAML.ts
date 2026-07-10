import { MetadataCatalog, MetadataCatalogYAML } from "./types"
import { ConfigurationContext } from "../../context/types"
import { importMetadataItemFromYAML } from "../../orchestration"
import { MetadataCatalogRules } from "./rules"

export const importMetadataCatalogFromYAML = (
  context: ConfigurationContext,
  data: MetadataCatalogYAML | undefined,
  name: string,
  source?: MetadataCatalog
): MetadataCatalog | undefined => {
  if (!data) return undefined

  const result = importMetadataItemFromYAML({
    context,
    yaml: data,
    rule: MetadataCatalogRules,
    name,
    source,
  })

  if (result == undefined) return undefined

  return {
    ...result,
    name,
  }
}
