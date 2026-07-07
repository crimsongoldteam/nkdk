import { JSON_SCHEMA, dump } from "js-yaml"
import { isExplicitYAMLString, unwrapExplicitYAMLString } from "./explicitString"

const EXPLICIT_STRING_MARKER_PREFIX = "__NKDK_EXPLICIT_STRING_"

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

function prepareForDump(value: unknown, explicitStrings: Map<string, string>): unknown {
  if (isExplicitYAMLString(value)) {
    return explicitStringMarker(String(unwrapExplicitYAMLString(value)), explicitStrings)
  }
  if (typeof value === "string" && shouldExportAsExplicitString(value)) return explicitStringMarker(value, explicitStrings)
  if (Array.isArray(value)) return value.map((item) => prepareForDump(item, explicitStrings))
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        item === undefined ? null : prepareForDump(item, explicitStrings),
      ])
    )
  }
  return value
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

function normalizeEmptyNullValues(yaml: string): string {
  return yaml.replace(/: null$/gm, ":")
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

export const exportToYAML = <T>(data: T): string => {
  const explicitStrings = new Map<string, string>()
  const yaml = dump(prepareForDump(data, explicitStrings), {
    schema: JSON_SCHEMA,
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    skipInvalid: false,
    sortKeys: false,
    forceQuotes: false,
    quoteStyle: "double",
  })
  return removeDocumentFinalLineEnding(
    normalizeQuotedTypeLinkValues(quoteExplicitStrings(normalizeEmptyNullValues(yaml), explicitStrings))
  )
}
