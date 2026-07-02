import { JSON_SCHEMA, YAMLException, load } from "js-yaml"
import { markDoubleQuotedScalar, type YAMLStyleKey } from "./explicitString"
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
  if (text.trim() === "") {
    return {
      text,
      data: undefined,
      locations,
      syntaxErrors: [],
    }
  }

  try {
    const data = load(text, { schema: JSON_SCHEMA })
    return {
      text,
      data: prepareJsYamlData(data, text, locations),
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

function prepareJsYamlData(data: unknown, text: string, locations: YamlLocationIndex): unknown {
  const lines = text.split(/\r?\n/)
  return visitYamlData(data, [], lines, locations)
}

function visitYamlData(
  value: unknown,
  path: readonly (string | number)[],
  lines: readonly string[],
  locations: YamlLocationIndex,
  parent?: object,
  key?: YAMLStyleKey,
): unknown {
  if (value === null || isSourceEmptyValue(value, path, lines, locations)) return undefined

  if (parent !== undefined && key !== undefined && typeof value === "string" && isDoubleQuotedValue(path, lines, locations)) {
    markDoubleQuotedScalar(parent, key)
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = visitYamlData(item, [...path, index], lines, locations, value, index)
    })
    return value
  }

  if (!isRecord(value)) return value
  for (const [entryKey, entryValue] of Object.entries(value)) {
    value[entryKey] = visitYamlData(entryValue, [...path, entryKey], lines, locations, value, entryKey)
  }
  return value
}

function isSourceEmptyValue(
  value: unknown,
  path: readonly (string | number)[],
  lines: readonly string[],
  locations: YamlLocationIndex,
): boolean {
  if (value !== "" || path.length === 0) return false
  if (isDoubleQuotedValue(path, lines, locations)) return false
  return locations.valuePosition(path) === undefined && locations.nodePosition(path) !== undefined
}

function isDoubleQuotedValue(
  path: readonly (string | number)[],
  lines: readonly string[],
  locations: YamlLocationIndex,
): boolean {
  const position = locations.valuePosition(path) ?? locations.nodePosition(path)
  if (position === undefined) return false
  return lines[position.line - 1]?.[position.col - 1] === "\""
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
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
