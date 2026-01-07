import { XMLBuilder } from "fast-xml-parser"

const options = {
  attributeNamePrefix: "_",
  ignoreAttributes: false,
  format: true,
  suppressEmptyNode: true,
  suppressBooleanAttributes: false,
  indentBy: "\t",
  oneListGroup: false,
  processEntities: false,
}

const builder = new XMLBuilder(options)

// @ts-ignore
builder.options.attributesGroupName = "@attributes"

// ВАЖНО: Изменения в библиотеке fast-xml-parser теперь применяются через patch
// См. patches/fast-xml-parser+5.3.3.patch
// При обновлении библиотеки проверьте, что patch применяется корректно

export const xmlExport = (data: Record<string, any>, addDeclaration: boolean = true): string => {
  const xml = builder.build(data)
  const declaration = addDeclaration ? '<?xml version="1.0" encoding="UTF-8"?>\n' : ""
  const result = declaration + xml
  return result.trimEnd()
}
