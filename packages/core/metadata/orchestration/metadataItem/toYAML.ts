import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToYAML } from "../property/toYAML"
import { MetadataItemRule } from "../property/types"
import { ToMetadata, ToYAML } from "./registry"
import { findInlineProperty } from "./yamlInline"

export const exportMetadataItemToYAML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  data: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
}): ToYAML<Rule["itemType"]> | undefined => {
  const { context, data, rule } = params
  if (!data) return undefined

  const yamlObj = exportPropertiesToYAML({
    context,
    data: { ...data, itemType: rule.itemType } as ToMetadata<Rule["itemType"]>,
    rule,
  })

  const inline = findInlineProperty(rule)
  if (inline) {
    return (yamlObj as any)?.[inline.yamlKey]
  }

  return yamlObj
}
