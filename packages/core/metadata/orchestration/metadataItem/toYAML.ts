import { ConfigurationContext } from "../../context/types"
import { exportPropertiesToYAML } from "../property/toYAML"
import { MetadataItemRule } from "../property/types"
import { ToMetadata, ToYAML } from "./registry"
import { findInlineProperty } from "./yamlInline"

export const exportMetadataItemToYAML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContext
  data: ToMetadata<Rule["itemType"]> | undefined
  rule: Rule
  name?: string
}): ToYAML<Rule["itemType"]> | undefined => {
  const { context, data, rule, name } = params
  if (!data) return undefined

  const yamlObj = exportPropertiesToYAML({
    context,
    data: { ...data, itemType: rule.itemType } as ToMetadata<Rule["itemType"]>,
    rule,
    name,
  })

  const inline = findInlineProperty(rule)
  if (inline) {
    const inlineValue = (data as any)[inline.key]
    if (
      Array.isArray(inlineValue) &&
      inlineValue.length === 0 &&
      Array.isArray((inline.prop as any).defaultValue) &&
      (inline.prop as any).defaultValue.length === 0
    ) {
      return inlineValue as ToYAML<Rule["itemType"]>
    }

    return (yamlObj as any)?.[inline.yamlKey]
  }

  return yamlObj
}
