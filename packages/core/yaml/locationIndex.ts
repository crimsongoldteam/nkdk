export interface YamlPosition {
  line: number
  col: number
}

export type YamlPath = readonly (string | number)[]

export interface YamlLocationIndex {
  rootPosition(): YamlPosition
  keyPosition(path: YamlPath): YamlPosition | undefined
  keyOccurrences(path: YamlPath): readonly YamlPosition[]
  valuePosition(path: YamlPath): YamlPosition | undefined
  nodePosition(path: YamlPath): YamlPosition | undefined
}

interface ContainerContext {
  indent: number
  path: YamlPath
}

interface KeyToken {
  key: string
  keyColumn: number
  valueColumn?: number
  hasValue: boolean
}

const pathKey = (path: YamlPath): string => JSON.stringify(path)

export function buildYamlLocationIndex(text: string): YamlLocationIndex {
  const keyPositions = new Map<string, YamlPosition>()
  const keyOccurrences = new Map<string, YamlPosition[]>()
  const valuePositions = new Map<string, YamlPosition>()
  const nodePositions = new Map<string, YamlPosition>()
  const sequenceIndexes = new Map<string, number>()
  const stack: ContainerContext[] = [{ indent: -1, path: [] }]

  nodePositions.set(pathKey([]), { line: 1, col: 1 })

  const lines = text.split(/\r?\n/)

  lines.forEach((line, index) => {
    const trimmed = line.trim()
    if (trimmed === "" || trimmed.startsWith("#")) return

    const indent = line.length - line.trimStart().length
    popClosedContexts(stack, indent)

    const lineNumber = index + 1
    const content = line.slice(indent)

    if (content.startsWith("- ")) {
      readSequenceItem({
        content,
        indent,
        lineNumber,
        stack,
        sequenceIndexes,
        keyPositions,
        keyOccurrences,
        valuePositions,
        nodePositions,
      })
      return
    }

    const keyToken = readKeyToken(line, indent)
    if (keyToken === undefined) return

    const parentPath = stack[stack.length - 1]?.path ?? []
    const currentPath = [...parentPath, keyToken.key]
    saveKeyTokenPositions({
      keyToken,
      lineNumber,
      currentPath,
      keyPositions,
      keyOccurrences,
      valuePositions,
      nodePositions,
    })

    if (!keyToken.hasValue || isBlockScalarHeaderAt(line, keyToken.valueColumn)) {
      stack.push({ indent, path: currentPath })
    }
  })

  return {
    rootPosition: () => ({ line: 1, col: 1 }),
    keyPosition: (path) => keyPositions.get(pathKey(path)),
    keyOccurrences: (path) => keyOccurrences.get(pathKey(path)) ?? [],
    valuePosition: (path) => valuePositions.get(pathKey(path)),
    nodePosition: (path) => nodePositions.get(pathKey(path)),
  }
}

function readSequenceItem(params: {
  content: string
  indent: number
  lineNumber: number
  stack: ContainerContext[]
  sequenceIndexes: Map<string, number>
  keyPositions: Map<string, YamlPosition>
  keyOccurrences: Map<string, YamlPosition[]>
  valuePositions: Map<string, YamlPosition>
  nodePositions: Map<string, YamlPosition>
}): void {
  const {
    content,
    indent,
    lineNumber,
    stack,
    sequenceIndexes,
    keyPositions,
    keyOccurrences,
    valuePositions,
    nodePositions,
  } = params
  const parentPath = stack[stack.length - 1]?.path ?? []
  const parentKey = pathKey(parentPath)
  const itemIndex = sequenceIndexes.get(parentKey) ?? 0
  sequenceIndexes.set(parentKey, itemIndex + 1)

  const itemPath = [...parentPath, itemIndex]
  nodePositions.set(pathKey(itemPath), { line: lineNumber, col: indent + 3 })

  const itemContent = content.slice(2)
  const itemLine = `${" ".repeat(indent + 2)}${itemContent}`
  const itemKeyToken = readKeyToken(itemLine, indent + 2)
  if (itemKeyToken === undefined) {
    if (itemContent.trim() === "" || isBlockScalarHeaderAt(itemContent, 1)) stack.push({ indent, path: itemPath })
    return
  }

  const currentPath = [...itemPath, itemKeyToken.key]
  saveKeyTokenPositions({
    keyToken: itemKeyToken,
    lineNumber,
    currentPath,
    keyPositions,
    keyOccurrences,
    valuePositions,
    nodePositions,
  })

  if (!itemKeyToken.hasValue || isBlockScalarHeaderAt(itemLine, itemKeyToken.valueColumn)) {
    stack.push({ indent, path: itemPath })
    stack.push({ indent: indent + 2, path: currentPath })
    return
  }

  stack.push({ indent, path: itemPath })
}

function popClosedContexts(stack: ContainerContext[], indent: number): void {
  while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
    stack.pop()
  }
}

function saveKeyTokenPositions(params: {
  keyToken: KeyToken
  lineNumber: number
  currentPath: YamlPath
  keyPositions: Map<string, YamlPosition>
  keyOccurrences: Map<string, YamlPosition[]>
  valuePositions: Map<string, YamlPosition>
  nodePositions: Map<string, YamlPosition>
}): void {
  const { keyToken, lineNumber, currentPath, keyPositions, keyOccurrences, valuePositions, nodePositions } = params
  const currentPathKey = pathKey(currentPath)
  const keyPosition = { line: lineNumber, col: keyToken.keyColumn }

  keyPositions.set(currentPathKey, keyPosition)
  const occurrences = keyOccurrences.get(currentPathKey)
  if (occurrences === undefined) {
    keyOccurrences.set(currentPathKey, [keyPosition])
  } else {
    occurrences.push(keyPosition)
  }
  nodePositions.set(currentPathKey, keyPosition)
  if (keyToken.valueColumn !== undefined)
    valuePositions.set(currentPathKey, { line: lineNumber, col: keyToken.valueColumn })
}

function readKeyToken(line: string, indent: number): KeyToken | undefined {
  const colonIndex = findMappingColon(line, indent)
  if (colonIndex === undefined) return undefined

  const keyText = line.slice(indent, colonIndex).trim()
  if (keyText === "") return undefined

  const valueStart = firstNonSpaceIndex(line, colonIndex + 1)
  return {
    key: unquoteKey(keyText),
    keyColumn: indent + leadingSpaceCount(line.slice(indent, colonIndex)) + 1,
    valueColumn: valueStart === undefined ? undefined : valueStart + 1,
    hasValue: valueStart !== undefined && line.slice(valueStart).trim() !== "",
  }
}

function findMappingColon(line: string, start: number): number | undefined {
  let quote: '"' | "'" | undefined

  for (let index = start; index < line.length; index += 1) {
    const char = line[index]
    if (quote !== undefined) {
      if (char === quote) quote = undefined
      continue
    }

    if (char === '"' || char === "'") {
      quote = char
      continue
    }

    if (char !== ":") continue

    const next = line[index + 1]
    if (next === undefined || next === " " || next === "\t") return index
  }

  return undefined
}

function firstNonSpaceIndex(line: string, start: number): number | undefined {
  for (let index = start; index < line.length; index += 1) {
    if (line[index] !== " ") return index
  }
  return undefined
}

function leadingSpaceCount(value: string): number {
  return value.length - value.trimStart().length
}

function unquoteKey(key: string): string {
  if (key.length >= 2 && ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'")))) {
    return key.slice(1, -1)
  }
  return key
}

function isBlockScalarHeaderAt(line: string, valueColumn: number | undefined): boolean {
  if (valueColumn === undefined) return false
  const value = line.slice(valueColumn - 1).trim()
  return value.startsWith("|") || value.startsWith(">")
}
