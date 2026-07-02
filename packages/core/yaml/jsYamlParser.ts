import { JSON_SCHEMA, YAMLException, load } from "js-yaml"
import { buildYamlLocationIndex, type YamlLocationIndex } from "./locationIndex"

export interface JsYamlSyntaxError {
  message: string
  line: number
  col: number
}

export interface JsParsedYaml {
  text: string
  data: unknown
  locations: YamlLocationIndex
  syntaxErrors: JsYamlSyntaxError[]
}

export function parseWithJsYaml(text: string): JsParsedYaml {
  const locations = buildYamlLocationIndex(text)

  try {
    return {
      text,
      data: load(text, { schema: JSON_SCHEMA }),
      locations,
      syntaxErrors: [],
    }
  } catch (error) {
    return {
      text,
      data: undefined,
      locations,
      syntaxErrors: [toSyntaxError(error, text)],
    }
  }
}

function toSyntaxError(error: unknown, text: string): JsYamlSyntaxError {
  if (error instanceof YAMLException && error.mark !== undefined) {
    const lineText = text.split(/\r?\n/)[error.mark.line] ?? ""
    return {
      message: error.reason || error.message,
      line: error.mark.line + 1,
      col: Math.max(1, Math.min(error.mark.column + 1, lineText.length)),
    }
  }

  return {
    message: error instanceof Error ? error.message : "Некорректный YAML",
    line: 1,
    col: 1,
  }
}
