import { XMLBuilder } from "fast-xml-parser"
import * as z from "zod"

export default function xmlExport<T>(
  data: T,
  schema: z.ZodType<T>,
  addDeclaration: boolean = true
): string {
  const parsedData = schema.parse(data)
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

  const xml = builder.build(parsedData)
  const declaration = addDeclaration
    ? '<?xml version="1.0" encoding="UTF-8"?>\n'
    : ""
  const result = declaration + xml
  return result.trim()
}
