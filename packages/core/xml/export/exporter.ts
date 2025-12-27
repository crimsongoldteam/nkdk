import { XMLBuilder } from "fast-xml-parser"

const ARRAY_FIELDS = ["v8:item", "xr:GeneratedType", "InternalInfo", "xr:Link"]

export const xmlExport = (data: Record<string, any>, addDeclaration: boolean = true): string => {
  const fixedData = fixArraysExport(data, ARRAY_FIELDS)
  const builder = new XMLBuilder({
    attributeNamePrefix: "_",
    ignoreAttributes: false,
    format: true,
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
    indentBy: "\t",
    oneListGroup: false,
    processEntities: false,
  })

  // @ts-ignore
  builder.options.attributesGroupName = "@attributes"

  const xml = builder.build(fixedData)
  const declaration = addDeclaration ? '<?xml version="1.0" encoding="UTF-8"?>\n' : ""
  const result = declaration + xml
  return result.trimEnd()
}

const processArrayField = (value: any, arrayFields: string[]): any[] => {
  if (Array.isArray(value)) return value.map((item) => fixArraysExport(item, arrayFields))

  if (value !== null && value !== undefined) return [fixArraysExport(value, arrayFields)]

  return []
}

const fixArraysExport = (data: any, arrayFields: string[]): any => {
  if (data === null || data === undefined) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => fixArraysExport(item, arrayFields))
  }

  if (typeof data !== "object") return data

  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(data)) {
    if (arrayFields.includes(key)) {
      result[key] = processArrayField(value, arrayFields)
    } else {
      result[key] = fixArraysExport(value, arrayFields)
    }
  }

  return result
}
