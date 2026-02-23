export const addIndentation = (lines: string[]): string[] => {
  return lines.map((line) => "  " + line)
}

export const joinLines = (lines: string[], separator: string): string => {
  return lines.join(separator)
}
