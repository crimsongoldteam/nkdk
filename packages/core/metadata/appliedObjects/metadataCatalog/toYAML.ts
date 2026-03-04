import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToYAML } from "~/metadata/orchestration"
import { MetadataCatalogRules } from "./rules"
import { MetadataCatalog, MetadataCatalogYAML } from "./types"

export const exportMetadataCatalogToYAML = (
  context: ConfigurationContext,
  data: MetadataCatalog | undefined
): MetadataCatalogYAML | undefined => {
  if (!data) return undefined

  const result = exportPropertiesToYAML({
    context,
    data: data,
    rules: MetadataCatalogRules,
  })

  return result
}
