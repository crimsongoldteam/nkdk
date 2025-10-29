import { XMLBuilder } from "fast-xml-parser"

export default function xmlExport<T>(data: T, addDeclaration: boolean = true): string {
  const builder = new XMLBuilder({
    attributeNamePrefix: "_",
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
    indentBy: "\t",
  })
  const xml = builder.build(data)
  const declaration = addDeclaration ? '<?xml version="1.0" encoding="UTF-8"?>\n' : ""
  const result = declaration + xml
  return result.trim()
}
