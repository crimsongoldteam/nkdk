export interface TreeNode {
  content: string
  childItems?: TreeNode[]
}

interface LineInfo {
  content: string
  level: number
}

export const parseTree = (text: string): TreeNode[] => {
  const lineInfos: LineInfo[] = text
    .split("\n")
    .map((line) => ({
      content: line.trim(),
      level: calculateLevel(line),
    }))
    .filter((line) => line.content !== "")

  if (lineInfos.length === 0) {
    return []
  }

  const result: TreeNode[] = []
  const stack: { node: TreeNode; level: number }[] = []

  for (const lineInfo of lineInfos) {
    const parsedGroup = parseGroupInOneLine(lineInfo.content)
    const node: TreeNode = parsedGroup
      ? {
          content: parsedGroup.header,
          childItems: parsedGroup.children.map((content) => ({ content })),
        }
      : {
          content: lineInfo.content,
        }

    while (stack.length > 0 && stack[stack.length - 1].level >= lineInfo.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      result.push(node)
    } else {
      const parent = stack[stack.length - 1].node
      if (!parent.childItems) {
        parent.childItems = []
      }
      parent.childItems.push(node)
    }

    stack.push({ node, level: lineInfo.level })
  }

  return result
}

const parseGroupInOneLine = (content: string): { header: string; children: string[] } | null => {
  if (!content.includes(";")) {
    return null
  }

  if (content.startsWith("%")) {
    const firstSemicolonIndex = content.indexOf(";")
    if (firstSemicolonIndex === -1) {
      return null
    }

    const headerPart = content.substring(0, firstSemicolonIndex).trim()
    const elementsPart = content.substring(firstSemicolonIndex + 1).trim()

    if (!elementsPart) {
      return null
    }

    const children = elementsPart
      .split(";")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    if (children.length === 0) {
      return null
    }

    const header = headerPart

    return { header, children }
  }

  let spaceIndex = -1
  for (let i = content.length - 1; i >= 0; i--) {
    if (content[i] === " " && content.substring(i + 1).includes(";")) {
      spaceIndex = i
      break
    }
  }

  if (spaceIndex === -1) {
    return null
  }

  const header = content.substring(0, spaceIndex).trim()
  const elementsPart = content.substring(spaceIndex + 1).trim()

  if (!header || !elementsPart) {
    return null
  }

  const children = elementsPart
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  if (children.length === 0) {
    return null
  }

  return { header, children }
}

const calculateLevel = (line: string): number => {
  let level = 0
  let i = 0

  while (i < line.length) {
    if (line[i] === "\t") {
      level++
      i++
    } else if (line[i] === " ") {
      let spaces = 0
      while (i < line.length && line[i] === " ") {
        spaces++
        i++
      }
      level += Math.ceil(spaces / 2)
      break
    } else {
      break
    }
  }

  return level
}
