import { ConfigurationContext } from "../../context/types"
import { importPropertiesFromYAML } from "../property/fromYAML"
import { MetadataItemRule } from "../property/types"
import { ToMetadata, ToYAML } from "./registry"
import { findInlineProperty } from "./yamlInline"

export const importMetadataItemFromYAML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  yaml: ToYAML<Rule["itemType"]> | undefined
  rule: Rule
  source?: ToMetadata<Rule["itemType"]>
  name?: string
}): ToMetadata<Rule["itemType"]> | undefined => {
  const { yaml, rule, source, name, context } = params

  const inline = findInlineProperty(rule)
  const effectiveYaml =
    inline !== undefined && yaml !== undefined
      ? ({ [inline.yamlKey]: yaml } as unknown as ToYAML<Rule["itemType"]>)
      : yaml

  const properties = importPropertiesFromYAML({
    context,
    yaml: effectiveYaml,
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
