import { dump, type Document, type Node } from "js-yaml"
import { isExplicitYAMLString, markDoubleQuotedScalar, unwrapExplicitYAMLString } from "./explicitString"
import {
  copyYAMLScalarTags,
  NKDK_YAML_SCHEMA,
  restoreYAMLScalarTagsAfterDump,
  taggedScalarForDump,
} from "./scalarTags"
import {
  copyYAMLMappingKeyOrder,
  copyYAMLMappingTag,
  createYAMLOrderedMapping,
  hasYAMLMappingKeyOrder,
  yamlMappingEntries,
} from "./mappingTags"
import {
  copyYAMLMappingKeyTags,
  yamlMappingKeyTagAt,
} from "./mappingKeyTags"

const EXPLICIT_STRING_MARKER_PREFIX = "__NKDK_EXPLICIT_STRING_"
const UNDEFINED_VALUE_MARKER_PREFIX = "__NKDK_UNDEFINED_VALUE_"

export interface SerializedYAMLDocument {
  readonly text: string
  readonly data: unknown
}

interface PreparedYAMLNode {
  readonly dumpValue: unknown
  readonly data: unknown
  readonly doubleQuoted?: true
}

const leadingSpaceCount = (line: string): number => line.length - line.trimStart().length

const isKeepChompingBlockScalarHeader = (line: string): boolean => {
  return /^\s*(?:(?:[^#\n]*?:|-)\s*)?[|>](?:\+(?:[1-9])?|[1-9]\+)\s*(?:#.*)?$/.test(line)
}

const endsInsideBlockScalar = (yaml: string): boolean => {
  const lines = yaml.split("\n")
  let finalContentIndent = Infinity

  for (let index = lines.length - 2; index >= 0; index -= 1) {
    const line = lines[index]
    if (line.trim() === "") continue

    const indent = leadingSpaceCount(line)
    if (isKeepChompingBlockScalarHeader(line)) return indent < finalContentIndent

    finalContentIndent = Math.min(finalContentIndent, indent)
  }

  return false
}

const removeDocumentFinalLineEnding = (yaml: string): string => {
  if (!yaml.endsWith("\n")) return yaml
  if (endsInsideBlockScalar(yaml)) return yaml
  return yaml.slice(0, -1)
}

function prepareForDump(
  value: unknown,
  explicitStrings: Map<string, string>,
  undefinedValues: Set<string>
): PreparedYAMLNode {
  if (isExplicitYAMLString(value)) {
    const data = String(unwrapExplicitYAMLString(value))
    return { dumpValue: explicitStringMarker(data, explicitStrings), data, doubleQuoted: true }
  }
  if (typeof value === "string" && shouldExportAsExplicitString(value)) {
    return { dumpValue: explicitStringMarker(value, explicitStrings), data: value, doubleQuoted: true }
  }
  if (Array.isArray(value)) {
    const prepared = value.map((item, index) =>
      prepareChildForDump(value, index, item, explicitStrings, undefinedValues)
    )
    const dumpValue = prepared.map(({ dumpValue }) => dumpValue)
    const data = prepared.map(({ data }) => data)
    prepared.forEach((item, index) => {
      if (item.doubleQuoted === true) markDoubleQuotedScalar(data, index)
    })
    copyYAMLScalarTags(value, data)
    return { dumpValue, data }
  }
  if (value !== null && typeof value === "object") {
    const entries = yamlMappingEntries(value as Record<string, unknown>)
    if (entries.length === 0) return { dumpValue: value, data: value }
    const prepared = entries.map(([key, item]) => [
      key,
      prepareChildForDump(value, key, item, explicitStrings, undefinedValues),
    ] as const)
    const preparedDumpEntries = prepared.map(([key, item]) => [key, item.dumpValue] as const)
    const preparedDataEntries = prepared.map(([key, item]) => [key, item.data] as const)
    const preserveOrder = hasYAMLMappingKeyOrder(value)
    const dumpValue = preserveOrder
      ? createYAMLOrderedMapping(preparedDumpEntries)
      : Object.fromEntries(preparedDumpEntries)
    const data = preserveOrder
      ? createYAMLOrderedMapping(preparedDataEntries)
      : Object.fromEntries(preparedDataEntries)
    for (const [key, item] of prepared) {
      if (item.doubleQuoted === true) markDoubleQuotedScalar(data, key)
    }
    copyYAMLScalarTags(value, data)
    copyYAMLMappingTag(value, dumpValue)
    copyYAMLMappingTag(value, data)
    copyYAMLMappingKeyOrder(value, dumpValue)
    copyYAMLMappingKeyOrder(value, data)
    copyYAMLMappingKeyTags(value, dumpValue)
    copyYAMLMappingKeyTags(value, data)
    return { dumpValue, data }
  }
  return { dumpValue: value, data: value }
}

function prepareChildForDump(
  parent: object,
  key: string | number,
  value: unknown,
  explicitStrings: Map<string, string>,
  undefinedValues: Set<string>
): PreparedYAMLNode {
  if (value === undefined && !Array.isArray(parent)) {
    const marker = `${UNDEFINED_VALUE_MARKER_PREFIX}${undefinedValues.size}__`
    undefinedValues.add(marker)
    return { dumpValue: marker, data: {} }
  }
  const prepared = value === undefined
    ? { dumpValue: null, data: null }
    : prepareForDump(value, explicitStrings, undefinedValues)
  return {
    dumpValue: taggedScalarForDump(parent, key, prepared.dumpValue),
    data: prepared.data,
    ...(prepared.doubleQuoted === true ? { doubleQuoted: true } : {}),
  }
}

function explicitStringMarker(value: string, explicitStrings: Map<string, string>): string {
  const marker = `${EXPLICIT_STRING_MARKER_PREFIX}${explicitStrings.size}__`
  explicitStrings.set(marker, value)
  return marker
}

function shouldExportAsExplicitString(value: string): boolean {
  if (value.includes("\n")) return false
  if (value === "") return true
  if (value.trim() !== value) return true
  if (!Number.isNaN(Number(value)) && value.trim() !== "") return true
  return /^[`@]/.test(value)
}

function restoreUndefinedValues(yaml: string, undefinedValues: Set<string>): string {
  let result = yaml
  for (const marker of undefinedValues) result = result.split(`: ${marker}`).join(":")
  return result
}

function normalizeQuotedTypeLinkValues(yaml: string): string {
  return yaml.replace(/(: )"(-?\d+\(\d+\))"$/gm, "$1$2")
}

function normalizeEmptyXMLTags(yaml: string): string {
  return yaml.replace(/!xml\/(present|absent|name|type|value|reference|language|duplicate) ""(?=[ \t]*(?:#.*)?$)/gm, "!xml/$1")
}

function normalizeEmptyMappings(yaml: string): string {
  if (yaml === "{}\n") return ""
  return yaml.replace(/^(\s*(?:-|.+:)) \{\}$/gm, "$1")
}

function quoteExplicitStrings(yaml: string, explicitStrings: Map<string, string>): string {
  let result = yaml
  for (const [marker, value] of explicitStrings) {
    result = result.split(marker).join(JSON.stringify(value))
  }
  return result
}

export function serializeYAMLDocument(source: unknown): SerializedYAMLDocument {
  const explicitStrings = new Map<string, string>()
  const undefinedValues = new Set<string>()
  const prepared = prepareForDump(source, explicitStrings, undefinedValues)
  const yaml = dump(prepared.dumpValue, {
    schema: NKDK_YAML_SCHEMA,
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    skipInvalid: false,
    sortKeys: false,
    forceQuotes: false,
    quoteStyle: "double",
    transform(documents) {
      applyYAMLMappingKeyTagsToAST(documents, prepared.dumpValue)
    },
  })
  const text = restoreYAMLScalarTagsAfterDump(
    removeDocumentFinalLineEnding(
      normalizeEmptyMappings(
        normalizeEmptyXMLTags(
          normalizeQuotedTypeLinkValues(
            quoteExplicitStrings(restoreUndefinedValues(yaml, undefinedValues), explicitStrings)
          )
        )
      )
    )
  )
  return { text, data: prepared.data }
}

function applyYAMLMappingKeyTagsToAST(
  documents: Document[],
  source: unknown,
): void {
  const document = documents[0]
  if (document !== undefined) applyYAMLMappingKeyTagsToNode(document.contents, source)
}

function applyYAMLMappingKeyTagsToNode(node: Node | null, source: unknown): void {
  if (node === null || node.kind === "alias") return
  if (node.kind === "sequence") {
    if (!Array.isArray(source)) return
    node.items.forEach((item, index) => applyYAMLMappingKeyTagsToNode(item, source[index]))
    return
  }
  if (node.kind !== "mapping" || !isRecord(source)) return

  for (const item of node.items) {
    if (item.key.kind !== "scalar") continue
    const key = item.key.value
    const tag = yamlMappingKeyTagAt(source, key)
    if (tag !== undefined) {
      if (tag !== "xml/reference") {
        throw new TypeError(`Тег !${tag} недопустим для ключа YAML`)
      }
      item.key.tag = `!${tag}`
      item.key.style.tagged = true
    }
    applyYAMLMappingKeyTagsToNode(item.value, source[key])
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export const exportToYAML = <T>(data: T): string => serializeYAMLDocument(data).text
