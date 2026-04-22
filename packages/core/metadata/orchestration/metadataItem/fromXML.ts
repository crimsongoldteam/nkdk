import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importContentFromXML } from "~/xml/import/importer"
import { importPropertiesFromXML } from "../property/fromXML"
import { MetadataItemRule } from "../property/types"
import { ToMetadata } from "./registry"

export const importMetadataItemFromXML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextFromXML
  rule: Rule
  tags?: string[]
} & ({ xml: any } | { xmlString: string })): ToMetadata<Rule["itemType"]> | undefined => {
  const { context, rule, tags } = params

  let xml = "xmlString" in params ? importContentFromXML(params.xmlString) : params.xml

  // Если правило содержит MetaDataObject-property, используем xml[container] как корень,
  // чтобы остальные свойства с xmlParents: [] и xmlParents: ["Properties"] работали
  // относительно внутреннего контейнера, а не обёртки <MetaDataObject>.
  const metaDataObjectProp = Object.values(rule.properties).find((p) => p.type === "MetaDataObject")
  if (metaDataObjectProp) {
    const container = (metaDataObjectProp as any).container as string
    xml = xml?.[container]
  }

  const properties = importPropertiesFromXML({
    context,
    rule,
    tags,
    xml,
  })

  if (!properties) return undefined

  return {
    ...properties,
    itemType: rule.itemType,
  } as ToMetadata<Rule["itemType"]>
}
