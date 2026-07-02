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
    const normalized = normalizeYamlMark(error.mark.line, error.mark.column, text)
    return {
      message: error.reason || error.message,
      line: normalized.line,
      col: normalized.col,
    }
  }

  return {
    message: error instanceof Error ? error.message : "Некорректный YAML",
    line: 1,
    col: 1,
  }
}

function normalizeYamlMark(line: number, column: number, text: string): { line: number; col: number } {
  const lines = text.split(/\r?\n/)
  const rawLine = lines[line]
  if (rawLine !== undefined && column < rawLine.length) {
    return { line: line + 1, col: Math.max(1, column + 1) }
  }

  const previousLineIndex = Math.min(line, lines.length - 1)
  for (let index = previousLineIndex; index >= 0; index -= 1) {
    const candidate = lines[index]
    const flowIndex = Math.max(candidate.lastIndexOf("["), candidate.lastIndexOf("{"))
    if (flowIndex >= 0) return { line: index + 1, col: flowIndex + 1 }
    if (candidate.trim() !== "") return { line: index + 1, col: Math.max(1, candidate.length) }
  }

  return { line: 1, col: 1 }
}
