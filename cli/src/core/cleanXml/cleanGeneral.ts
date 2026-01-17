import { XMLBuilder, XMLParser } from "fast-xml-parser"

interface CleanContext {
  namespaces: Record<string, string>
}

export const cleanGeneral = (context: CleanContext, xmlContent: string): string => {
  const parsedData = parseXml(xmlContent)
  const processedData = addNamespaces(context, parsedData)
  const sortedData = processData(processedData)
  const xml = buildXml(sortedData)
  return xml
}

const parseXml = (context: CleanContext, xmlContent: string): any => {
  const primaryOptions = {
    preserveOrder: false,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    attributesGroupName: "@attributes",
    textNodeName: "#text",
    trimValues: true,
    parseTagValue: true,
    parseAttributeValue: false,
    processEntities: true,
    htmlEntities: true,
    ignoreDeclaration: false,
    ignorePiTags: false,
  }

  try {
    const parser = new XMLParser(primaryOptions)
    return parser.parse(xmlContent)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Ошибка парсинга XML: ${errorMessage}`)
  }
}

const addNamespaces = (context: CleanContext, parsedData: any): any => {
  return parsedData
}

const removeEmptyNodes = (context: CleanContext, parsedData: any): any => {
  return parsedData
}

const sortData = (context: CleanContext, parsedData: any): any => {
  return parsedData
}

const processData = (context: CleanContext, parsedData: any): any => {
  return parsedData
}

const buildXml = (context: CleanContext, parsedData: any): string => {
  const builder = new XMLBuilder({
    preserveOrder: false,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    attributesGroupName: "@attributes",
    textNodeName: "#text",
    format: true,
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
    indentBy: "\t",
    processEntities: true,
  })

  const outputXml = builder.build(parsedData)

  return outputXml.trimEnd()
}
