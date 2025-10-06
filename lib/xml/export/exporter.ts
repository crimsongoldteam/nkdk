import { XMLBuilder } from "fast-xml-parser"

export default function xmlExport<T>(data: T): string {
  const builder = new XMLBuilder({ attributeNamePrefix: "_", ignoreAttributes: false, format: true })
  const xml = builder.build(data)
  const declaration = '<?xml version="1.0" encoding="UTF-8"?>'
  const result = declaration + "\n" + xml
  return result.trim()
}
