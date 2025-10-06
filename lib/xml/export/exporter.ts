import { XMLBuilder } from "fast-xml-parser"

export default function xmlExport<T>(data: T): string {
  const builder = new XMLBuilder({ attributeNamePrefix: "_", ignoreAttributes: false, format: true })
  return builder.build(data).trim()
}
