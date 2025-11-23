interface TreeNode {
  content: string
  childItems?: TreeNode[]
}

interface LineInfo {
  content: string
  level: number
}

export const parseTree = (text: string): TreeNode[] => {
  const lines = text.split("\n")

  // Парсим все строки с их уровнями
  const lineInfos: LineInfo[] = []
  for (const line of lines) {
    if (line.trim() === "") {
      continue
    }
    const level = calculateLevel(line)
    const content = line.trim()
    lineInfos.push({ content, level })
  }

  if (lineInfos.length === 0) {
    return []
  }

  const result: TreeNode[] = []
  const stack: { node: TreeNode; level: number }[] = []

  for (let i = 0; i < lineInfos.length; i++) {
    const lineInfo = lineInfos[i]
    const node: TreeNode = { content: lineInfo.content }

    // Находим правильного родителя для текущего узла
    while (
      stack.length > 0 &&
      stack[stack.length - 1].level >= lineInfo.level
    ) {
      stack.pop()
    }

    if (stack.length === 0) {
      // Это корневой элемент
      result.push(node)
    } else {
      // Это дочерний элемент
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

const calculateLevel = (line: string): number => {
  let level = 0
  let i = 0

  while (i < line.length) {
    if (line[i] === "\t") {
      // Таб = один уровень
      level++
      i++
    } else if (line[i] === " ") {
      // Пробелы: считаем каждый пробел как часть отступа
      // 1-2 пробела = 1 уровень, 3-4 пробела = 2 уровня и т.д.
      let spaces = 0
      while (i < line.length && line[i] === " ") {
        spaces++
        i++
      }
      level += Math.ceil(spaces / 2)
      break // После пробелов не должно быть табов в начале строки
    } else {
      break
    }
  }

  return level
}
