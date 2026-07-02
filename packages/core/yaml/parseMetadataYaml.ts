import { Document, LineCounter, parseDocument } from "yaml"
import { documentToJSWithScalarStyles } from "./import"
import { parseWithJsYaml, type JsYamlSyntaxError } from "./jsYamlParser"
import type { YamlLocationIndex } from "./locationIndex"

export interface ParsedYaml {
  text: string
  doc: Document
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any
  lineCounter: LineCounter
  locations: YamlLocationIndex
  syntaxErrors: JsYamlSyntaxError[]
}

export function parseMetadataYaml(text: string): ParsedYaml {
  const parsedWithJsYaml = parseWithJsYaml(text)
  const lineCounter = new LineCounter()
  const doc = parseDocument(text, { lineCounter })
  const data = documentToJSWithScalarStyles(doc)
  return {
    text,
    doc,
    data,
    lineCounter,
    locations: parsedWithJsYaml.locations,
    syntaxErrors: parsedWithJsYaml.syntaxErrors,
  }
}
