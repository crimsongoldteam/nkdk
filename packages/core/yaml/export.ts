import { dump } from "js-yaml"
import { isExplicitYAMLString, unwrapExplicitYAMLString } from "./explicitString"
import { NKDK_YAML_SCHEMA, taggedScalarForDump } from "./scalarTags"

const EXPLICIT_STRING_MARKER_PREFIX = "__NKDK_EXPLICIT_STRING_"
const UNDEFINED_VALUE_MARKER_PREFIX = "__NKDK_UNDEFINED_VALUE_"

export interface SerializedYAMLDocument {
  readonly text: string
  readonly data: unknown
}

interface PreparedYAMLNode {
  readonly dumpValue: unknown
  readonly data: unknown
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
    return { dumpValue: explicitStringMarker(data, explicitStrings), data }
  }
  if (typeof value === "string" && shouldExportAsExplicitString(value)) {
    return { dumpValue: explicitStringMarker(value, explicitStrings), data: value }
  }
  if (Array.isArray(value)) {
    const prepared = value.map((item, index) =>
      prepareChildForDump(value, index, item, explicitStrings, undefinedValues)
    )
    return {
      dumpValue: prepared.map(({ dumpValue }) => dumpValue),
      data: prepared.map(({ data }) => data),
    }
  }
  if (value !== null && typeof value === "object") {
    const prepared = Object.entries(value).map(([key, item]) => [
      key,
      prepareChildForDump(value, key, item, explicitStrings, undefinedValues),
    ] as const)
    return {
      dumpValue: Object.fromEntries(prepared.map(([key, item]) => [key, item.dumpValue])),
      data: Object.fromEntries(prepared.map(([key, item]) => [key, item.data])),
    }
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
    return { dumpValue: marker, data: undefined }
  }
  const prepared = value === undefined
    ? { dumpValue: null, data: null }
    : prepareForDump(value, explicitStrings, undefinedValues)
  return {
    dumpValue: taggedScalarForDump(parent, key, prepared.dumpValue),
    data: prepared.data,
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
  })
  const text = removeDocumentFinalLineEnding(
    normalizeQuotedTypeLinkValues(quoteExplicitStrings(restoreUndefinedValues(yaml, undefinedValues), explicitStrings))
  )
  return { text, data: prepared.data }
}

export const exportToYAML = <T>(data: T): string => serializeYAMLDocument(data).text
