import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { importContentFromXML } from "~/xml/import/importer"
import { importPropertiesFromXML } from "../property/fromXML"
import { MetadataItemRule } from "../property/types"
import { ToMetadata } from "./registry"

const XML_REFERENCE_RAW = "__xmlReferenceRaw"

export const importMetadataItemFromXML = <Rule extends MetadataItemRule>(params: {
  context: ConfigurationContextFromXML
  rule: Rule
  tags?: string[]
} & ({ xml: any } | { xmlString: string })): ToMetadata<Rule["itemType"]> | undefined => {
  const { context, rule, tags } = params

  let xml = "xmlString" in params ? importContentFromXML(params.xmlString) : params.xml
  let xmlRootKey: string | undefined
  let xmlRootAttributes: Record<string, string> | undefined

  // Если правило содержит XMLRoot-property, используем xml[container] как корень,
  // чтобы остальные свойства с xmlParents: [] и xmlParents: ["Properties"] работали
  // относительно внутреннего контейнера, а не внешней обёртки.
  const xmlRootEntry = Object.entries(rule.properties).find(([, p]) => p.type === "XMLRoot")
  if (xmlRootEntry) {
    const [key, xmlRootProp] = xmlRootEntry
    xmlRootKey = key
    const container = (xmlRootProp as any).container as string
    const isFileRoot = (xmlRootProp as any).isFileRoot === true
    if (isFileRoot) {
      // Корень XML уже = container; убираем атрибуты и оставляем дочерние теги.
      if (xml && typeof xml === "object" && container in (xml as object)) {
        xml = (xml as any)[container]
      }
      xmlRootAttributes = extractRootAttributes(xml)
    } else {
      xmlRootAttributes = extractRootAttributes(xml)
      xml = xml?.[container]
    }
  }

  const xmlForProperties = xml
  const properties = importPropertiesFromXML({
    context,
    rule,
    tags,
    xml,
  })

  if (!properties) return undefined
  const result = {
    ...properties,
    itemType: rule.itemType,
  } as ToMetadata<Rule["itemType"]>

  if (context.fromXML.forReference && xmlForProperties && typeof xmlForProperties === "object") {
    Object.defineProperty(result, XML_REFERENCE_RAW, {
      value: xmlForProperties,
      enumerable: false,
    })
  }
  if (context.fromXML.forReference && xmlRootKey && xmlRootAttributes) {
    Object.defineProperty(result, xmlRootKey, {
      value: xmlRootAttributes,
      enumerable: false,
    })
  }

  return result
}

const extractRootAttributes = (xml: unknown): Record<string, string> | undefined => {
  if (xml === null || xml === undefined || typeof xml !== "object") return undefined
  const attributes = Object.fromEntries(
    Object.entries(xml as Record<string, unknown>).filter(
      (entry): entry is [string, string] => entry[0].startsWith("_") && typeof entry[1] === "string"
    )
  )
  return Object.keys(attributes).length > 0 ? attributes : undefined
}
