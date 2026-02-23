import { XMLBuilder } from "fast-xml-parser"

export const buildXml = (parsedData: any, addHeader = true): string => {
  if (parsedData === null || parsedData === undefined) {
    return ""
  }

  const builder = new XMLBuilder({
    preserveOrder: true,
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    format: true,
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
    indentBy: "\t",
    processEntities: true,
    // htmlEntities: true,
  })

  try {
    const outputXml = builder.build(parsedData)
    const trimmedOutput = outputXml.trimStart()
    if (addHeader) {
      if (trimmedOutput.startsWith("<?xml")) {
        return trimmedOutput
      }
      return '<?xml version="1.0" encoding="UTF-8"?>\n' + trimmedOutput
    }
    return trimmedOutput.trimEnd()
  } catch (error) {
    console.error("Error building XML:", error)
    return ""
  }
}
