import { Document, LineCounter, parseDocument } from "yaml"

export interface ParsedYaml {
  text: string
  doc: Document
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  lineCounter: LineCounter
}

export function parseMetadataYaml(text: string): ParsedYaml {
  const lineCounter = new LineCounter()
  const doc = parseDocument(text, { lineCounter })
  const data = doc.toJS()
  return { text, doc, data, lineCounter }
}
