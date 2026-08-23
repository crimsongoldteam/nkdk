import {
  eventsToAst,
  EVENT_MAPPING,
  EVENT_POP,
  EVENT_SCALAR,
  EVENT_SEQUENCE,
  SCALAR_STYLE_DOUBLE_QUOTED,
  SCALAR_STYLE_SINGLE_QUOTED,
  load,
  parseEvents,
  present,
  YAMLException,
  type Event,
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
import {
  createXmlAnomalyAnnotations,
  type XmlAnomalyAnnotation,
  type XmlAnomalyAnnotations,
  type XmlAnomalyKind,
} from "./xmlAnomalyAnnotations"

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
  annotations: XmlAnomalyAnnotations
}

export interface JsParsedYamlData {
  data: unknown
  syntaxErrors: JsYamlSyntaxError[]
  annotations: XmlAnomalyAnnotations
}

export function parseWithJsYaml(text: string): JsParsedYaml {
  const locations = buildYamlLocationIndex(text)
  const annotations = createXmlAnomalyAnnotations()
  if (text.trim() === "") {
    return {
      text,
      data: {},
      locations,
      syntaxErrors: [],
      annotations,
    }
  }

  try {
    const normalized = parseYamlData(text, locations, annotations)
    return {
      text,
      data: normalized,
      locations,
      syntaxErrors: [],
      annotations,
    }
  } catch (error) {
    return {
      text,
      data: {},
      locations,
      syntaxErrors: [toSyntaxError(error, text)],
      annotations,
    }
  }
}

export function parseDataWithJsYaml(text: string): JsParsedYamlData {
  const annotations = createXmlAnomalyAnnotations()
  if (text.trim() === "") {
    return {
      data: {},
      syntaxErrors: [],
      annotations,
    }
  }

  try {
    const locations = buildYamlLocationIndex(text)
    const normalized = parseYamlData(text, locations, annotations)
    return {
      data: normalized,
      syntaxErrors: [],
      annotations,
    }
  } catch (error) {
    return {
      data: undefined,
      syntaxErrors: [toSyntaxError(error, text)],
      annotations,
    }
  }
}

function parseYamlData(
  text: string,
  locations: YamlLocationIndex,
  annotations: ReturnType<typeof createXmlAnomalyAnnotations>,
): unknown {
  const prepared = prepareMappingKeyTags(text)
  const data = load(prepared.loadText, { schema: NKDK_YAML_SCHEMA })
  const normalized = prepareJsYamlData(data, text, locations, prepared.sourcePaths)
  applyParsedMappingKeyTags(normalized, prepared.tags)
  return applyParsedXmlAnomalyAnnotations(normalized, prepared.annotations, annotations)
}

interface ParsedMappingKeyTag {
  readonly containerPath: readonly (string | number)[]
  readonly key: string
}

interface ParsedXmlAnomalyAnnotation {
  readonly annotation: XmlAnomalyAnnotation
  readonly parentPath: readonly (string | number)[]
  readonly key: string | number | undefined
  readonly rawPayload?: "compact" | "null"
}

function prepareMappingKeyTags(text: string): {
  readonly loadText: string
  readonly tags: readonly ParsedMappingKeyTag[]
  readonly annotations: readonly ParsedXmlAnomalyAnnotation[]
  readonly sourcePaths: ReadonlyMap<string, readonly (string | number)[]>
} {
  const source = prepareYAMLScalarTagsForParser(text)
  const events = parseEvents(source, {})
  const documents = eventsToAst(events, {
    source,
    schema: NKDK_YAML_SCHEMA,
  })
  const tags: ParsedMappingKeyTag[] = []
  const annotations: ParsedXmlAnomalyAnnotation[] = []
  const sourcePaths = new Map<string, readonly (string | number)[]>()
  const taggedKeySources = annotatedMappingKeySources(source, events)
  for (const document of documents) collectYamlTags(document.contents, [], [], tags, annotations, sourcePaths, taggedKeySources)
  if (tags.length === 0 && annotations.every((entry) => entry.annotation.target !== "key")) {
    return { loadText: source, tags, annotations, sourcePaths }
  }
  return {
    loadText: present(documents, {
      schema: NKDK_YAML_SCHEMA,
      indent: 2,
      lineWidth: -1,
    }),
    tags,
    annotations,
    sourcePaths,
  }
}

function collectYamlTags(
  node: Node | null,
  path: readonly (string | number)[],
  sourcePath: readonly (string | number)[],
  tags: ParsedMappingKeyTag[],
  annotations: ParsedXmlAnomalyAnnotation[],
  sourcePaths: Map<string, readonly (string | number)[]>,
  taggedKeySources: string[],
): void {
  if (node === null || node.kind === "alias") return
  const rootTag = xmlAnomalyTag(node.tag)
  if (rootTag !== undefined && path.length === 0) {
    assertValueAnnotation(rootTag, node.tag)
    annotations.push({
      annotation: annotationFor(rootTag, "root"),
      parentPath: [],
      key: undefined,
      rawPayload: rawPayloadOf(node, rootTag.kind),
    })
  }
  if (node.kind === "sequence") {
    node.items.forEach((item, index) => {
      collectValueAnnotation(item, path, index, annotations)
      collectYamlTags(item, [...path, index], [...sourcePath, index], tags, annotations, sourcePaths, taggedKeySources)
    })
    return
  }
  if (node.kind !== "mapping") return

  const usedRuntimeKeys = new Set(
    node.items.flatMap(({ key }) => key.kind === "scalar" ? [key.value] : []),
  )
  const expectedOccurrences = new Map<string, number>()
  for (const { key, value } of node.items) {
    const annotationTag = xmlAnomalyTag(key.tag)
    let runtimeKey: string | undefined
    if (annotationTag !== undefined) {
      if (annotationTag.kind === "raw") throw new YAMLException("!xml/raw недопустим для ключа YAML")
      if (key.kind !== "scalar") {
        throw new YAMLException(`${key.tag} поддерживает только скалярный ключ`)
      }
      if (annotationTag.numbered && annotationTag.occurrence === 1) {
        throw new YAMLException(`Тег ${key.tag} не использует номер /1`)
      }
      const sourceKey = taggedKeySources.shift()
      if (sourceKey === undefined) throw new YAMLException("Не найден исходный ключ XML-аннотации")
      const expected = expectedOccurrences.get(key.value) ?? 1
      if (annotationTag.occurrence !== expected) {
        throw new YAMLException(`Тег ${key.tag} нарушает нумерацию повторного ключа ${key.value}`)
      }
      expectedOccurrences.set(key.value, expected + 1)
      runtimeKey = uniqueRuntimeKey(usedRuntimeKeys)
      annotations.push({
        annotation: annotationFor(annotationTag, "key", key.value),
        parentPath: path,
        key: runtimeKey,
      })
      key.value = runtimeKey
      key.tag = "tag:yaml.org,2002:str"
      key.style.tagged = false
      sourcePaths.set(pathKey([...path, runtimeKey]), [...sourcePath, sourceKey])
    } else if (key.tag.startsWith("!xml/")) {
      if (key.tag !== "!xml/reference") throw new YAMLException(`Тег ${key.tag} недопустим для ключа YAML`)
      if (key.kind !== "scalar") throw new YAMLException("!xml/reference поддерживает только скалярный ключ")
      tags.push({ containerPath: path, key: key.value })
      key.tag = "tag:yaml.org,2002:str"
      key.style.tagged = false
    }
    if (key.kind !== "scalar") continue
    const nextKey = runtimeKey ?? key.value
    const nextSourcePath = sourcePaths.get(pathKey([...path, nextKey])) ?? [...sourcePath, key.value]
    collectValueAnnotation(value, path, nextKey, annotations)
    collectYamlTags(value, [...path, nextKey], nextSourcePath, tags, annotations, sourcePaths, taggedKeySources)
  }
}

function collectValueAnnotation(
  node: Node,
  parentPath: readonly (string | number)[],
  key: string | number,
  annotations: ParsedXmlAnomalyAnnotation[],
): void {
  const tag = xmlAnomalyTag(node.tag)
  if (tag === undefined) return
  assertValueAnnotation(tag, node.tag)
  annotations.push({
    annotation: annotationFor(tag, "value"),
    parentPath,
    key,
    rawPayload: rawPayloadOf(node, tag.kind),
  })
}

function rawPayloadOf(node: Node, kind: XmlAnomalyKind): "compact" | "null" | undefined {
  if (kind !== "raw" || node.kind !== "scalar" || node.style.doubleQuoted || node.style.singleQuoted) return undefined
  if (node.value === "") return "compact"
  return node.value === "null" || node.value === "~" ? "null" : undefined
}

function xmlAnomalyTag(tag: string): { kind: XmlAnomalyKind; occurrence: number; numbered: boolean } | undefined {
  const match = /^!xml\/(raw|invalid|important)(?:\/([1-9]\d*))?$/u.exec(tag)
  if (match === null) return undefined
  return { kind: match[1] as XmlAnomalyKind, occurrence: Number(match[2] ?? 1), numbered: match[2] !== undefined }
}

function assertValueAnnotation(tag: { kind: XmlAnomalyKind; occurrence: number; numbered: boolean }, tagName: string): void {
  if (tag.numbered) throw new YAMLException(`Тег ${tagName} допустим только для ключа YAML`)
}

function annotationFor(
  tag: { kind: XmlAnomalyKind; occurrence: number },
  target: XmlAnomalyAnnotation["target"],
  logicalKey?: string,
): XmlAnomalyAnnotation {
  return { kind: tag.kind, occurrence: tag.occurrence, target, ...(logicalKey === undefined ? {} : { logicalKey }) }
}

function uniqueRuntimeKey(usedKeys: Set<string>): string {
  let index = 1
  while (usedKeys.has(`__NKDK_XML_ANOMALY_KEY_${index}__`)) index += 1
  const key = `__NKDK_XML_ANOMALY_KEY_${index}__`
  usedKeys.add(key)
  return key
}

function pathKey(path: readonly (string | number)[]): string {
  return JSON.stringify(path)
}

function annotatedMappingKeySources(source: string, events: readonly Event[]): string[] {
  const sources: string[] = []
  const containers: { readonly mapping: boolean; expectsKey?: boolean }[] = []
  for (const event of events) {
    if (event.type === EVENT_POP) {
      containers.pop()
      continue
    }
    if (event.type !== EVENT_SCALAR && event.type !== EVENT_MAPPING && event.type !== EVENT_SEQUENCE) continue
    const container = containers[containers.length - 1]
    const isMappingKey = container?.mapping === true && container.expectsKey === true
    if (container?.mapping === true) container.expectsKey = !container.expectsKey
    if (event.type === EVENT_SCALAR && isMappingKey && isXmlAnnotationTagEvent(source, event)) {
      sources.push(source.slice(event.tagStart, sourceScalarEnd(event)).trim())
    }
    if (event.type === EVENT_MAPPING) containers.push({ mapping: true, expectsKey: true })
    if (event.type === EVENT_SEQUENCE) containers.push({ mapping: false })
  }
  return sources
}

function isXmlAnnotationTagEvent(source: string, event: Extract<Event, { type: typeof EVENT_SCALAR }>): boolean {
  if (event.tagStart < 0 || event.tagEnd < 0) return false
  return /^!xml\/(?:raw|invalid|important)(?:\/[1-9]\d*)?$/u.test(source.slice(event.tagStart, event.tagEnd))
}

function sourceScalarEnd(event: Extract<Event, { type: typeof EVENT_SCALAR }>): number {
  return event.style === SCALAR_STYLE_DOUBLE_QUOTED || event.style === SCALAR_STYLE_SINGLE_QUOTED
    ? event.valueEnd + 1
    : event.valueEnd
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

function applyParsedXmlAnomalyAnnotations(
  data: unknown,
  parsed: readonly ParsedXmlAnomalyAnnotation[],
  annotations: ReturnType<typeof createXmlAnomalyAnnotations>,
): unknown {
  let normalized = data
  for (const entry of parsed) {
    if (entry.annotation.target === "root") {
      annotations.setRoot(entry.annotation)
      if (entry.rawPayload === "compact") normalized = undefined
      if (entry.rawPayload === "null") normalized = null
      continue
    }
    const parent = valueAtPath(data, entry.parentPath)
    if (!isRecord(parent) && !Array.isArray(parent)) continue
    if (entry.annotation.target === "key" && typeof entry.key === "string") {
      annotations.setKey(parent, entry.key, entry.annotation)
      continue
    }
    if (entry.key !== undefined) {
      if (entry.rawPayload === "null") setValueAt(parent, entry.key, null)
      annotations.set(parent, entry.key, entry.annotation)
    }
  }
  return normalized
}

function setValueAt(parent: Record<string, unknown> | unknown[], key: string | number, value: unknown): void {
  if (Array.isArray(parent) && typeof key === "number") {
    parent[key] = value
    return
  }
  if (isRecord(parent) && typeof key === "string") parent[key] = value
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

function prepareJsYamlData(
  data: unknown,
  text: string,
  locations: YamlLocationIndex,
  sourcePaths: ReadonlyMap<string, readonly (string | number)[]>,
): unknown {
  const lines = text.split(/\r?\n/)
  return visitYamlData(data, [], [], lines, locations, sourcePaths)
}

function visitYamlData(
  value: unknown,
  path: readonly (string | number)[],
  sourcePath: readonly (string | number)[],
  lines: readonly string[],
  locations: YamlLocationIndex,
  sourcePaths: ReadonlyMap<string, readonly (string | number)[]>,
  parent?: object,
  key?: YAMLStyleKey
): unknown {
  if (isTaggedYAMLScalar(value)) {
    if (parent !== undefined && key !== undefined) markYAMLScalarTag(parent, key, value.tag)
    const resolvedValue = isEmptyRecord(value.value) && isDoubleQuotedTaggedValue(sourcePath, lines, locations)
      ? ""
      : value.value
    if (parent !== undefined && key !== undefined && resolvedValue === "") {
      markDoubleQuotedScalar(parent, key)
    }
    return resolvedValue
  }

  if (value === null) return isExplicitNullValue(sourcePath, lines, locations) ? null : {}
  if (isSourceEmptyValue(value, sourcePath, lines, locations)) return {}

  if (
    parent !== undefined &&
    key !== undefined &&
    typeof value === "string" &&
    isDoubleQuotedValue(sourcePath, lines, locations)
  ) {
    markDoubleQuotedScalar(parent, key)
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      value[index] = visitYamlData(item, [...path, index], [...sourcePath, index], lines, locations, sourcePaths, value, index)
    })
    return value
  }

  if (!isRecord(value)) return value
  const sourceKeys = sourceKeyOrder(value, path, sourcePath, locations, sourcePaths)
  const runtimeKeys = Object.keys(value)
  if (sourceKeys.some((entryKey, index) => entryKey !== runtimeKeys[index])) {
    markYAMLMappingKeyOrder(value, sourceKeys)
  }
  for (const entryKey of yamlMappingKeys(value)) {
    const entryValue = value[entryKey]
    const entryPath = [...path, entryKey]
    const entrySourcePath = sourcePaths.get(pathKey(entryPath)) ?? [...sourcePath, entryKey]
    value[entryKey] = visitYamlData(entryValue, entryPath, entrySourcePath, lines, locations, sourcePaths, value, entryKey)
  }
  return value
}

function sourceKeyOrder(
  value: Record<string, unknown>,
  path: readonly (string | number)[],
  sourcePath: readonly (string | number)[],
  locations: YamlLocationIndex,
  sourcePaths: ReadonlyMap<string, readonly (string | number)[]>,
): string[] {
  return Object.keys(value).sort((left, right) => {
    const leftPosition = locations.keyPosition(sourcePaths.get(pathKey([...path, left])) ?? [...sourcePath, left])
    const rightPosition = locations.keyPosition(sourcePaths.get(pathKey([...path, right])) ?? [...sourcePath, right])
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
