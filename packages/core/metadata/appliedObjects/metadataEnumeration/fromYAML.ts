import { MetadataEnumeration, MetadataEnumerationYAML } from "~/metadata/appliedObjects/metadataEnumeration/types"
import { ConfigurationContext } from "~/metadata/context/types"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { MetadataEnumerationRules } from "./rules"

export const importMetadataEnumerationFromYAML = (
  context: ConfigurationContext,
  data: MetadataEnumerationYAML | undefined,
  name: string,
): MetadataEnumeration | undefined => {
  if (!data) return undefined

  const result = importMetadataItemFromYAML({
    context,
    yaml: data,
    rule: MetadataEnumerationRules,
    name,
  })

  if (result == undefined) return undefined

  return {
    ...result,
    name,
  }
}
