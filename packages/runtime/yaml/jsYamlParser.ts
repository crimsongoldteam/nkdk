import {
  eventsToAst,
  load,
  parseEvents,
  present,
  YAMLException,
  type Node,
} from "js-yaml"
import { markDoubleQuotedScalar, type YAMLStyleKey } from "./explicitString"
import { buildYamlLocationIndex, type YamlLocationIndex } from "./locationIndex"
import {
  isTaggedYAMLScalar,
  markYAMLScalarTag,
  NKDK_YAML_SCHEMA,
  prepareYAMLScalarTagsForParser,
} from "./scalarTags"
import { markYAMLMappingKeyOrder, yamlMappingKeys } from "./mappingTags"
import { markYAMLMappingKeyTag } from "./mappingKeyTags"

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

export interface JsParsedYamlData {
  data: unknown
  syntaxErrors: JsYamlSyntaxError[]
}

export function parseWithJsYaml(text: string): JsParsedYaml {
  const locations = buildYamlLocationIndex(text)
  if (text.trim() === "") {
    return {
      text,
      data: {},
      locations,
      syntaxErrors: [],
    }
  }

  try {
    const prepared = prepareMappingKeyTags(text)
    const data = load(prepared.loadText, { schema: NKDK_YAML_SCHEMA })
    const normalized = prepareJsYamlData(data, text, locations)
    applyParsedMappingKeyTags(normalized, prepared.tags)
    return {
      text,
      data: normalized,
      locations,
      syntaxErrors: [],
    }
  } catch (error) {
    return {
      text,
      data: {},
      locations,
      syntaxErrors: [toSyntaxError(error, text)],
    }
  }
}

export function parseDataWithJsYaml(text: string): JsParsedYamlData {
  if (text.trim() === "") {
    return {
      data: {},
      syntaxErrors: [],
    }
  }

  try {
    const locations = buildYamlLocationIndex(text)
    const prepared = prepareMappingKeyTags(text)
    const data = load(prepared.loadText, { schema: NKDK_YAML_SCHEMA })
    const normalized = prepareJsYamlData(data, text, locations)
    applyParsedMappingKeyTags(normalized, prepared.tags)
    return {
      data: normalized,
      syntaxErrors: [],
    }
  } catch (error) {
    return {
      data: undefined,
      syntaxErrors: [toSyntaxError(error, text)],
    }
  }
}

interface ParsedMappingKeyTag {
  readonly containerPath: readonly (string | number)[]
  readonly key: string
}

function prepareMappingKeyTags(text: string): {
  readonly loadText: string
  readonly tags: readonly ParsedMappingKeyTag[]
} {
  const source = prepareYAMLScalarTagsForParser(text)
  const documents = eventsToAst(parseEvents(source, {}), {
    source,
    schema: NKDK_YAML_SCHEMA,
  })
  const tags: ParsedMappingKeyTag[] = []
  for (const document of documents) {
    collectMappingKeyTags(document.contents, [], tags)
  }
  if (tags.length === 0) return { loadText: source, tags }
  return {
    loadText: present(documents, {
      schema: NKDK_YAML_SCHEMA,
      indent: 2,
      lineWidth: -1,
    }),
    tags,
  }
}

function collectMappingKeyTags(
  node: Node | null,
  path: readonly (string | number)[],
  tags: ParsedMappingKeyTag[],
): void {
  if (node === null || node.kind === "alias") return
  if (node.kind === "sequence") {
    node.items.forEach((item, index) => collectMappingKeyTags(item, [...path, index], tags))
    return
  }
  if (node.kind !== "mapping") return

  for (const { key, value } of node.items) {
    if (key.tag.startsWith("!xml/")) {
      if (key.tag !== "!xml/reference") {
        throw new YAMLException(`Тег ${key.tag} недопустим для ключа YAML`)
      }
      if (key.kind !== "scalar") {
        throw new YAMLException("!xml/reference поддерживает только скалярный ключ")
      }
      tags.push({ containerPath: path, key: key.value })
      key.tag = "tag:yaml.org,2002:str"
      key.style.tagged = false
    }
    if (key.kind !== "scalar") continue
    collectMappingKeyTags(value, [...path, key.value], tags)
  }
}

function applyParsedMappingKeyTags(
  data: unknown,
  tags: readonly ParsedMappingKeyTag[],
): void {
  for (const { containerPath, key } of tags) {
    const container = valueAtPath(data, containerPath)
    if (isRecord(container) && Object.prototype.hasOwnProperty.call(container, key)) {
      markYAMLMappingKeyTag(container, key, "xml/reference")
    }
  }
}

function valueAtPath(value: unknown, path: readonly (string | number)[]): unknown {
  let current = value
  for (const segment of path) {
    if (Array.isArray(current) && typeof segment === "number") {
      current = current[segment]
      continue
    }
    if (isRecord(current) && typeof segment === "string") {
      current = current[segment]
      continue
    }
    return undefined
  }
  return current
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
  key?: YAMLStyleKey
): unknown {
  if (isTaggedYAMLScalar(value)) {
    if (parent !== undefined && key !== undefined) markYAMLScalarTag(parent, key, value.tag)
    const resolvedValue = isEmptyRecord(value.value) && isDoubleQuotedTaggedValue(path, lines, locations)
      ? ""
      : value.value
    if (parent !== undefined && key !== undefined && resolvedValue === "") {
      markDoubleQuotedScalar(parent, key)
    }
    return resolvedValue
  }

  if (value === null) return isExplicitNullValue(path, lines, locations) ? null : {}
  if (isSourceEmptyValue(value, path, lines, locations)) return {}

  if (
    parent !== undefined &&
    key !== undefined &&
    typeof value === "string" &&
    isDoubleQuotedValue(path, lines, locations)
  ) {
    markDoubleQuotedScalar(parent, key)
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = visitYamlData(item, [...path, index], lines, locations, value, index)
    })
    return value
  }

  if (!isRecord(value)) return value
  const sourceKeys = sourceKeyOrder(value, path, locations)
  const runtimeKeys = Object.keys(value)
  if (sourceKeys.some((entryKey, index) => entryKey !== runtimeKeys[index])) {
    markYAMLMappingKeyOrder(value, sourceKeys)
  }
  for (const entryKey of yamlMappingKeys(value)) {
    const entryValue = value[entryKey]
    value[entryKey] = visitYamlData(entryValue, [...path, entryKey], lines, locations, value, entryKey)
  }
  return value
}

function sourceKeyOrder(
  value: Record<string, unknown>,
  path: readonly (string | number)[],
  locations: YamlLocationIndex,
): string[] {
  return Object.keys(value).sort((left, right) => {
    const leftPosition = locations.keyPosition([...path, left])
    const rightPosition = locations.keyPosition([...path, right])
    if (leftPosition === undefined || rightPosition === undefined) return 0
    return leftPosition.line - rightPosition.line || leftPosition.col - rightPosition.col
  })
}

function isSourceEmptyValue(
  value: unknown,
  path: readonly (string | number)[],
  lines: readonly string[],
  locations: YamlLocationIndex
): boolean {
  if (value !== "" || path.length === 0) return false
  if (isDoubleQuotedValue(path, lines, locations)) return false
  return locations.valuePosition(path) === undefined && locations.nodePosition(path) !== undefined
}

function isExplicitNullValue(
  path: readonly (string | number)[],
  lines: readonly string[],
  locations: YamlLocationIndex
): boolean {
  const lastSegment = path[path.length - 1]
  const position =
    locations.valuePosition(path) ??
    (path.length === 0 || typeof lastSegment === "number" ? locations.nodePosition(path) : undefined)
  if (position === undefined) return false
  const source = lines[position.line - 1]?.slice(position.col - 1).trimStart() ?? ""
  return /^(?:null|~)(?:\s*(?:#.*)?$|[\],}])/i.test(source)
}

function isDoubleQuotedValue(
  path: readonly (string | number)[],
  lines: readonly string[],
  locations: YamlLocationIndex
): boolean {
  return sourceAtValuePosition(path, lines, locations).startsWith('"')
}

function isDoubleQuotedTaggedValue(
  path: readonly (string | number)[],
  lines: readonly string[],
  locations: YamlLocationIndex
): boolean {
  return /^!(?:проверять|изменять)\s+"/u.test(sourceAtValuePosition(path, lines, locations))
}

function sourceAtValuePosition(
  path: readonly (string | number)[],
  lines: readonly string[],
  locations: YamlLocationIndex
): string {
  const position = locations.valuePosition(path) ?? locations.nodePosition(path)
  return position === undefined
    ? ""
    : (lines[position.line - 1]?.slice(position.col - 1).trimStart() ?? "")
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isEmptyRecord(value: unknown): value is Record<string, never> {
  return isRecord(value) && Object.keys(value).length === 0
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
