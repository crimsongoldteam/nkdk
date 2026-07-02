import { MetadataEnumeration, MetadataEnumerationYAML } from "./types"
import { ConfigurationContext } from "../../context/types"
import { importMetadataItemFromYAML } from "../../orchestration"
import { MetadataEnumerationRules } from "./rules"
import "./valuesFromYAML"

export const importMetadataEnumerationFromYAML = (
  context: ConfigurationContext,
  data: MetadataEnumerationYAML | undefined,
  name: string
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
