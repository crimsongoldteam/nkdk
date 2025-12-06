export interface TreeNode {
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

    // Обработка специального случая: группа в одной строке (заголовок элементы; элементы)
    const parsedGroup = parseGroupInOneLine(lineInfo.content)
    if (parsedGroup) {
      const node: TreeNode = {
        content: parsedGroup.header,
        childItems: parsedGroup.children.map((content) => ({ content })),
      }

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
    } else {
      const node: TreeNode = {
        content: lineInfo.content,
        // type: detectElementType(lineInfo.content),
        // offest: lineInfo.offest,
      }

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
  }

  return result
}

const parseGroupInOneLine = (
  content: string
): { header: string; children: string[] } | null => {
  // Проверяем, содержит ли строка точку с запятой (признак группы в одной строке)
  if (!content.includes(";")) {
    return null
  }

  // Ищем разделитель между заголовком и элементами
  // Ищем последний пробел, после которого в оставшейся части есть точка с запятой
  // Это позволяет корректно обрабатывать заголовки с пробелами
  let spaceIndex = -1
  for (let i = content.length - 1; i >= 0; i--) {
    if (content[i] === " ") {
      const afterSpace = content.substring(i + 1)
      if (afterSpace.includes(";")) {
        spaceIndex = i
        break
      }
    }
  }

  // Если не нашли подходящий пробел, это не группа в одной строке
  if (spaceIndex === -1) {
    return null
  }

  const header = content.substring(0, spaceIndex).trim()
  const elementsPart = content.substring(spaceIndex + 1).trim()

  // Если заголовок пустой или нет элементов, это не группа
  if (!header || !elementsPart) {
    return null
  }

  // Разделяем элементы по точке с запятой
  const children = elementsPart
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

  // Если нет элементов после разбиения, это не группа
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
