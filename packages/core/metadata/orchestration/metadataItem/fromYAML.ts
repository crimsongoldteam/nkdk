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

  const inlineEntries = Object.entries(rule.properties).filter(
    ([, p]) => (p as any).yamlInline === true && (p as any).forReferenceOnly !== true
  )
  if (inlineEntries.length > 1) {
    throw new Error(
      `Rule "${rule.itemType}": yamlInline=true должно быть установлено максимум для одного свойства, найдено ${inlineEntries.length}`
    )
  }

  let effectiveYaml = yaml
  if (inlineEntries.length === 1 && yaml !== undefined) {
    const [key, prop] = inlineEntries[0]
    const yamlKey = (prop as any).yaml ?? key
    effectiveYaml = { [yamlKey]: yaml } as unknown as ToYAML<Rule["itemType"]>
  }

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
