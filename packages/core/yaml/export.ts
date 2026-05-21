import { stringify } from "yaml"

const leadingSpaceCount = (line: string): number => line.length - line.trimStart().length

const isBlockScalarHeader = (line: string): boolean => {
  return /(?:^|[:\-\s])[|>](?:[+-]?\d?|\d?[+-]?)\s*(?:#.*)?$/.test(line)
}

const endsInsideBlockScalar = (yaml: string): boolean => {
  const lines = yaml.split("\n")
  let finalContentIndent = Infinity

  for (let index = lines.length - 2; index >= 0; index -= 1) {
    const line = lines[index]
    if (line.trim() === "") continue

    const indent = leadingSpaceCount(line)
    if (isBlockScalarHeader(line)) return indent < finalContentIndent

    finalContentIndent = Math.min(finalContentIndent, indent)
  }

  return false
}

const removeDocumentFinalLineEnding = (yaml: string): string => {
  if (!yaml.endsWith("\n")) return yaml
  if (endsInsideBlockScalar(yaml)) return yaml
  return yaml.slice(0, -1)
}

export const exportToYAML = <T>(data: T): string => {
  const yaml = stringify(data, {
    indent: 2,
    lineWidth: 0,
    keepUndefined: true,
    nullStr: "",
  })
  return removeDocumentFinalLineEnding(yaml)
}
