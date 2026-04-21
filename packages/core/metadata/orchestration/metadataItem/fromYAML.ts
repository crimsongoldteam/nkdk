import { ConfigurationContext } from "~/metadata/context/types"
import { importPropertiesFromYAML } from "../property/fromYAML"
import { MetadataItemRule } from "../property/types"
import { ToMetadata, ToYAML } from "./registry"

export const importMetadataItemFromYAML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  yaml: ToYAML<Rule["itemType"]> | undefined
  rule: Rule
  source?: ToMetadata<Rule["itemType"]>
  name?: string
}): ToMetadata<Rule["itemType"]> | undefined => {
  const { yaml, rule, source, name, context } = params

  const properties = importPropertiesFromYAML({
    context,
    yaml,
    metadataRule: rule,
    source,
    name,
  })

  if (properties == undefined) {
    return undefined
  }

  return {
    ...properties,
    itemType: rule.itemType,
  } as ToMetadata<Rule["itemType"]>
}
