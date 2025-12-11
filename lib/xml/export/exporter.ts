import { XMLBuilder } from "fast-xml-parser"

export const xmlExport = (
  data: Record<string, any>,
  addDeclaration: boolean = true
): string => {
  const builder = new XMLBuilder({
    attributeNamePrefix: "_",
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
    indentBy: "\t",
    oneListGroup: true,
    processEntities: false,
    // attributesGroupName: "@attributes",
  })

  // @ts-ignore
  builder.options.attributesGroupName = "@attributes"

  const xml = builder.build(data)
  const declaration = addDeclaration
    ? '<?xml version="1.0" encoding="UTF-8"?>\n'
    : ""
  const result = declaration + xml
  return result.trim()
}
