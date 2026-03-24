import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importPropertiesFromXML } from "../property/fromXML"
import { MetadataItemRule } from "../property/types"
import { ToMetadata } from "./registry"

export const importMetadataItemFromXML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextFromXML
  xml: any
  rule: Rule
  tags?: string[]
}): ToMetadata<Rule["itemType"]> | undefined => {
  const { context, xml, rule, tags } = params

  const properties = importPropertiesFromXML({
    context,
    xml,
    rule,
    tags,
  })

  if (!properties) return undefined

  return {
    ...properties,
    itemType: rule.itemType,
  } as ToMetadata<Rule["itemType"]>
}
