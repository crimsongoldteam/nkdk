import { Scalar, stringify } from "yaml"
import { isExplicitYAMLString } from "./explicitString"

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

const toYAMLNodes = (value: unknown): unknown => {
  if (isExplicitYAMLString(value)) {
    const scalar = new Scalar(value.value)
    scalar.type = Scalar.QUOTE_DOUBLE
    return scalar
  }

  if (Array.isArray(value)) return value.map(toYAMLNodes)

  if (value !== null && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, toYAMLNodes(item)]))
  }

  return value
}

export const exportToYAML = <T>(data: T): string => {
  const yaml = stringify(toYAMLNodes(data), {
    indent: 2,
    lineWidth: 0,
    keepUndefined: true,
    nullStr: "",
  })
  return removeDocumentFinalLineEnding(yaml)
}
