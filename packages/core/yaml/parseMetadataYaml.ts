import { parseWithJsYaml, type JsYamlSyntaxError } from "./jsYamlParser"
import type { YamlLocationIndex } from "./locationIndex"

export interface ParsedYaml {
  text: string
  data: unknown
  locations: YamlLocationIndex
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
