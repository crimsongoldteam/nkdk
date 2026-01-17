import { XMLBuilder } from "fast-xml-parser"

export const buildXml = (parsedData: any): string => {
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
