import { IFormatterParams } from "../types"

export const addIndents = (
  lines: string[],
  params: IFormatterParams
): string[] => {
  if (lines.length === 0) {
    return []
  }

  const indent = getIndent(params)

  const result: string[] = [formatFirstLine(lines[0], params)]
  for (let i = 1; i < lines.length; i++) {
    result.push(indent + lines[i])
  }

  return addSpaces(result)
}

export const addSimpleIndent = (lines: string[]): string[] => {
  return lines.map((line) => "  " + line)
}

const formatFirstLine = (line: string, params: IFormatterParams): string => {
  if (params.isFirst) {
    return line
  }
  // remove first symbol "#"
  return line.slice(1)
}

const getIndent = (params: IFormatterParams): string => {
  return params.isFirst ? "  " : ""
}

const addSpaces = (textLines: string[]): string[] => {
  const maxLength = getMaxLength(textLines)
  return textLines.map((line) => line.padEnd(maxLength, " "))
}

const getMaxLength = (textLines: string[]): number => {
  return textLines.reduce((max, line) => Math.max(max, line.length), 0)
}
