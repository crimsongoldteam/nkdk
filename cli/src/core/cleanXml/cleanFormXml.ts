import { XMLBuilder, XMLParser } from "fast-xml-parser"
import { SORTABLE_TAGS } from "./cleanXml.js"

export function prepareFormXml(xmlContent: string): string {
  const parsedData = parseXml(xmlContent)
  const processedData = processFormElement(parsedData)
  return buildXml(processedData)
}

function parseXml(xmlContent: string): any {
  // Основные настройки парсера (как в cleanXml.ts)
  const primaryOptions = {
    preserveOrder: false,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    attributesGroupName: "@attributes",
    textNodeName: "#text",
    trimValues: true,
    parseTagValue: true,
    parseAttributeValue: false,
    processEntities: true,
    htmlEntities: true,
    ignoreDeclaration: false,
    ignorePiTags: false,
  }

  try {
    const parser = new XMLParser(primaryOptions)
    return parser.parse(xmlContent)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Ошибка парсинга XML: ${errorMessage}`)
  }
}

function buildXml(parsedData: any): string {
  const builder = new XMLBuilder({
    preserveOrder: false,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    attributesGroupName: "@attributes",
    textNodeName: "#text",
    format: true,
    suppressEmptyNode: true,
    suppressBooleanAttributes: false,
    indentBy: "\t",
    processEntities: false,
  })

  // Устанавливаем attributesGroupName через options (как в cleanXml.ts)
  // @ts-ignore
  builder.options.attributesGroupName = "@attributes"

  const outputXml = builder.build(parsedData)

  // Добавляем XML декларацию, если её нет
  if (!outputXml.trim().startsWith("<?xml")) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + outputXml
  }

  return outputXml.trimEnd()
}

function processFormElement(obj: any, parentKey: string = ""): any {
  if (obj === null || obj === undefined) {
    return undefined
  }

  // Если это примитив (строка, число, boolean), возвращаем как есть
  if (typeof obj !== "object") {
    return obj
  }

  // Если это массив, обрабатываем каждый элемент
  if (Array.isArray(obj)) {
    const shouldSortItems = SORTABLE_TAGS.includes(parentKey) || parentKey.endsWith(":Properties")
    const processed = obj.map((item) => processFormElement(item, parentKey))

    // Сортируем дочерние элементы внутри SORTABLE_TAGS
    if (shouldSortItems) {
      processed.sort((a, b) => {
        const keyA = getElementKey(a)
        const keyB = getElementKey(b)
        return keyA.localeCompare(keyB, "ru")
      })
    }

    return processed.length > 0 ? processed : undefined
  }

  // Создаем новый объект для результата
  const result: Record<string, any> = {}

  // Обрабатываем атрибуты (они всегда идут первыми)
  if (obj["@attributes"]) {
    result["@attributes"] = obj["@attributes"]
  }

  // Получаем все ключи (кроме @attributes)
  const allKeys = Object.keys(obj).filter((key) => key !== "@attributes")

  // Сортируем ключи по алфавиту
  const sortedKeys = allKeys.sort()

  for (const key of sortedKeys) {
    const originalValue = obj[key]

    // Рекурсивно обрабатываем значение
    // Для ChildItems сохраняем порядок элементов (не сортируем массив)
    if (key === "ChildItems" && Array.isArray(originalValue)) {
      // Сохраняем порядок элементов в ChildItems, но сортируем свойства каждого элемента
      result[key] = originalValue.map((item) => processFormElement(item, key))
    } else {
      // Для всех остальных элементов рекурсивно обрабатываем и сортируем свойства
      const processedValue = processFormElement(originalValue, key)
      if (processedValue !== undefined) {
        result[key] = processedValue
      }
    }
  }

  // Если объект пустой (нет атрибутов и нет свойств), возвращаем undefined
  if (Object.keys(result).length === 0) {
    return undefined
  }

  return result
}

/**
 * Извлекает ключ элемента для сортировки
 * Используется для сортировки дочерних элементов внутри SORTABLE_TAGS
 */
function getElementKey(element: any): string {
  if (typeof element === "string") {
    return element
  }
  if (typeof element === "object" && element !== null) {
    // Пытаемся найти ключ в атрибутах name
    if (element["@attributes"] && element["@attributes"].name) {
      return element["@attributes"].name
    }
    // Пытаемся найти текстовое содержимое
    if (element["#text"]) {
      return String(element["#text"])
    }
    // Используем первый ключ объекта (кроме @attributes)
    const keys = Object.keys(element).filter((key) => key !== "@attributes")
    if (keys.length > 0) {
      return keys[0]
    }
  }
  return ""
}
