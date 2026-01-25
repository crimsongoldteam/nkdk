import { XMLBuilder } from "fast-xml-parser"

export const buildXml = (parsedData: any): string => {
  if (parsedData === null || parsedData === undefined) {
    return ""
  }

  const builder = new XMLBuilder({
    preserveOrder: true,
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

  try {
    const outputXml = builder.build(parsedData)
    const trimmedOutput = outputXml.trimStart()
    if (trimmedOutput === "") return ""
    if (!trimmedOutput.startsWith("<?xml")) {
      return '<?xml version="1.0" encoding="UTF-8"?>\n' + trimmedOutput
    }
    return outputXml.trimEnd()
  } catch (error) {
    console.error("Error building XML:", error)
    return ""
  }
}
