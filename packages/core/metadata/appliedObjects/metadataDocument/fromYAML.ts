import { MetadataDocument, MetadataDocumentYAML } from "~/metadata/appliedObjects/metadataDocument/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { MetadataDocumentRules } from "./rules"

export const importMetadataDocumentFromYAML = (
  context: ConfigurationContext,
  data: MetadataDocumentYAML | undefined,
  name: string
): MetadataDocument | undefined => {
  if (!data) return undefined

  const result = importMetadataItemFromYAML({
    context,
    yaml: data,
    rule: MetadataDocumentRules,
    name,
  })

  if (result == undefined) return undefined

  return {
    ...result,
    name,
  }
}
