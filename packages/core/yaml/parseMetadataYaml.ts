import { parseDataWithJsYaml, parseWithJsYaml, type JsYamlSyntaxError } from "./jsYamlParser"
import type { YamlLocationIndex } from "./locationIndex"

export interface ParsedYaml {
  text: string
  data: unknown
  locations: YamlLocationIndex
  syntaxErrors: JsYamlSyntaxError[]
}

export interface ParsedYamlData {
  data: unknown
  syntaxErrors: JsYamlSyntaxError[]
}

export function parseMetadataYaml(text: string): ParsedYaml {
  const parsed = parseWithJsYaml(text)
  return {
    text,
    data: parsed.data,
    locations: parsed.locations,
    syntaxErrors: parsed.syntaxErrors,
  }
}

export function parseMetadataYamlData(text: string): ParsedYamlData {
  const parsed = parseDataWithJsYaml(text)
  return {
    data: parsed.data,
    syntaxErrors: parsed.syntaxErrors,
  }
}
