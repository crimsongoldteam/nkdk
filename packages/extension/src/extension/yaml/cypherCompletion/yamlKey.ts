export function topLevelYamlKeyAtLine(text: string, line: number): string | undefined {
  const currentLine = text.split(/\r?\n/)[line]

  if (!currentLine || /^\s/.test(currentLine)) {
    return undefined
  }

  const separatorIndex = currentLine.indexOf(":")

  if (separatorIndex === -1) {
    return undefined
  }

  return currentLine.slice(0, separatorIndex)
}
