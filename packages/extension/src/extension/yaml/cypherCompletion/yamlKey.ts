export function topLevelYamlKeyAtLine(text: string, line: number): string | undefined {
  const currentLine = text.split(/\r?\n/)[line]

  if (!currentLine || /^\s/.test(currentLine)) {
    return undefined
  }

  const match = /^([^:#][^:]*):/.exec(currentLine)

  if (!match) {
    return undefined
  }

  return match[1].trim()
}
