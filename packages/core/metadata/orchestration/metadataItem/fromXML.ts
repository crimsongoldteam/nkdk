import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importPropertiesFromXML } from "../property/fromXML"
import { MetadataItemRule } from "../property/types"
import { ToMetadata } from "./registry"

export const importMetadataItemFromXML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextFromXML
  rule: Rule
  tags?: string[]
} & ({ xml: any } | { xmlString: string })): ToMetadata<Rule["itemType"]> | undefined => {
  const { context, rule, tags } = params

  const properties = importPropertiesFromXML({
    context,
    rule,
    tags,
    ...("xmlString" in params ? { xmlString: params.xmlString } : { xml: params.xml }),
  })

  if (!properties) return undefined

  return {
    ...properties,
    itemType: rule.itemType,
  } as ToMetadata<Rule["itemType"]>
}
