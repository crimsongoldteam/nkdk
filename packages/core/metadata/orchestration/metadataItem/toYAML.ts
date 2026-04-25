import { ConfigurationContext } from "~/metadata/context/types"
import { exportPropertiesToYAML } from "../property/toYAML"
import { MetadataItemRule } from "../property/types"
import { ToMetadata, ToYAML } from "./registry"

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

  const inlineEntries = Object.entries(rule.properties).filter(
    ([, p]) => (p as any).yamlInline === true && (p as any).forReferenceOnly !== true
  )
  if (inlineEntries.length > 1) {
    throw new Error(
      `Rule "${rule.itemType}": yamlInline=true должно быть установлено максимум для одного свойства, найдено ${inlineEntries.length}`
    )
  }
  if (inlineEntries.length === 1) {
    const [key, prop] = inlineEntries[0]
    const yamlKey = (prop as any).yaml ?? key
    return (yamlObj as any)?.[yamlKey]
  }

  return yamlObj
}
