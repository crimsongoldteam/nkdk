import { XMLBuilder, XMLParser } from "fast-xml-parser"
import { SORTABLE_TAGS } from "./cleanXml.js"

export function prepareFormXml(xmlContent: string): string {
  const parsedData = parseXml(xmlContent)
  // Обрабатываем Form элемент с правильным parentKey
  const processedData = parsedData.Form
    ? { Form: processFormElement(parsedData.Form, "Form") }
    : processFormElement(parsedData)
  const renumberedData = renumberIds(processedData)
  return buildXml(renumberedData)
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
  if (!outputXml || !outputXml.trim().startsWith("<?xml")) {
    const content = outputXml && outputXml.trim() ? outputXml : ""
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + content
  }

  return outputXml.trimEnd()
}

// Порядок элементов для корневого элемента Form
const FORM_ELEMENT_ORDER = ["Title", "AutoTitle", "AutoCommandBar", "Events", "ChildItems", "Attributes", "Commands"]

// Порядок элементов внутри Command
const COMMAND_ELEMENT_ORDER = ["Title", "ToolTip", "Action", "CurrentRowUse"]

// Порядок элементов внутри v8:item
const V8_ITEM_ORDER = ["v8:lang", "v8:content"]

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
    const shouldSortItems =
      (SORTABLE_TAGS.includes(parentKey) || parentKey.endsWith(":Properties")) && parentKey !== "ChildItems"
    const processed = obj.map((item) => processFormElement(item, parentKey))

    // Сортируем дочерние элементы внутри SORTABLE_TAGS, но не для ChildItems
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

  // Определяем порядок ключей в зависимости от контекста
  let sortedKeys: string[]
  if (parentKey === "Form") {
    // Для объекта Form используем фиксированный порядок элементов
    sortedKeys = FORM_ELEMENT_ORDER.filter((key) => allKeys.includes(key))
    // Добавляем остальные ключи, которых нет в порядке, отсортированные по алфавиту
    const remainingKeys = allKeys.filter((key) => !FORM_ELEMENT_ORDER.includes(key)).sort()
    sortedKeys = [...sortedKeys, ...remainingKeys]
  } else if (parentKey === "Commands" && allKeys.some((key) => COMMAND_ELEMENT_ORDER.includes(key))) {
    // Для объекта Command (когда parentKey = "Commands") используем фиксированный порядок элементов
    sortedKeys = COMMAND_ELEMENT_ORDER.filter((key) => allKeys.includes(key))
    // Добавляем остальные ключи, которых нет в порядке, отсортированные по алфавиту
    const remainingKeys = allKeys.filter((key) => !COMMAND_ELEMENT_ORDER.includes(key)).sort()
    sortedKeys = [...sortedKeys, ...remainingKeys]
  } else if (allKeys.includes("v8:lang") && allKeys.includes("v8:content")) {
    // Для v8:item используем фиксированный порядок: сначала lang, потом content
    sortedKeys = V8_ITEM_ORDER.filter((key) => allKeys.includes(key))
    // Добавляем остальные ключи, которых нет в порядке, отсортированные по алфавиту
    const remainingKeys = allKeys.filter((key) => !V8_ITEM_ORDER.includes(key)).sort()
    sortedKeys = [...sortedKeys, ...remainingKeys]
  } else {
    // Для всех остальных элементов сортируем по алфавиту
    sortedKeys = allKeys.sort()
  }

  for (const key of sortedKeys) {
    const originalValue = obj[key]

    // Рекурсивно обрабатываем значение
    // Для ChildItems сохраняем порядок элементов (не сортируем массив и не сортируем ключи объекта)
    if (key === "ChildItems") {
      if (Array.isArray(originalValue)) {
        // Сохраняем порядок элементов в ChildItems, но сортируем свойства каждого элемента
        result[key] = originalValue.map((item) => processFormElement(item, key))
      } else if (originalValue && typeof originalValue === "object") {
        // Если ChildItems - объект, сохраняем порядок ключей (не сортируем)
        const childItemsResult: Record<string, any> = {}
        const childItemsKeys = Object.keys(originalValue)
        for (const childKey of childItemsKeys) {
          const childValue = originalValue[childKey]
          if (Array.isArray(childValue)) {
            // Сохраняем порядок элементов в массиве
            childItemsResult[childKey] = childValue.map((item) => processFormElement(item, key))
          } else if (childValue && typeof childValue === "object") {
            // Обрабатываем элемент, сохраняя порядок
            const processedChild = processFormElement(childValue, key)
            // Сохраняем элемент даже если он пустой после обработки (может содержать только атрибуты)
            if (processedChild !== undefined) {
              childItemsResult[childKey] = processedChild
            } else {
              // Если обработка вернула undefined, сохраняем исходный элемент
              childItemsResult[childKey] = childValue
            }
          } else {
            // Примитивные значения сохраняем как есть
            childItemsResult[childKey] = childValue
          }
        }
        result[key] = childItemsResult
      } else {
        result[key] = originalValue
      }
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

/**
 * Перенумеровывает id элементов и атрибутов сверху вниз
 * Пропускает элементы AutoCommandBar с id="-1"
 */
function renumberIds(obj: any): any {
  let idCounter = 1

  /**
   * Проверяет, является ли элемент AutoCommandBar с id="-1"
   */
  function isAutoCommandBarWithMinusOne(element: any, elementKey?: string): boolean {
    // Проверяем, является ли ключ элемента "AutoCommandBar"
    if (elementKey !== "AutoCommandBar") {
      return false
    }

    if (!element || typeof element !== "object" || Array.isArray(element)) {
      return false
    }

    const attrs = element["@attributes"]
    if (!attrs || attrs.id !== "-1") {
      return false
    }

    return true
  }

  /**
   * Определяет тип элемента по его структуре
   */
  function getElementType(element: any): string | undefined {
    if (typeof element === "object" && element !== null && !Array.isArray(element)) {
      const keys = Object.keys(element).filter((key) => key !== "@attributes" && key !== "#text")
      if (keys.length > 0) {
        return keys[0]
      }
    }
    return undefined
  }

  /**
   * Рекурсивно обрабатывает элемент и перенумеровывает id
   */
  function processElement(element: any, elementKey?: string): any {
    if (element === null || element === undefined) {
      return element
    }

    // Если это примитив, возвращаем как есть
    if (typeof element !== "object") {
      return element
    }

    // Если это массив, обрабатываем каждый элемент
    if (Array.isArray(element)) {
      return element.map((item) => {
        const itemType = getElementType(item)
        return processElement(item, itemType)
      })
    }

    // Создаем копию элемента
    const result: Record<string, any> = {}

    // Обрабатываем атрибуты
    if (element["@attributes"]) {
      const attrs = { ...element["@attributes"] }

      // Проверяем, нужно ли пропустить этот элемент
      const shouldSkip = isAutoCommandBarWithMinusOne(element, elementKey)

      // Если это не AutoCommandBar с id="-1", перенумеровываем id
      if (attrs.id !== undefined && !shouldSkip) {
        attrs.id = String(idCounter++)
      }

      result["@attributes"] = attrs
    }

    // Обрабатываем все остальные ключи
    const allKeys = Object.keys(element).filter((key) => key !== "@attributes" && key !== "#text")

    // Определяем порядок обработки для корневого элемента Form
    let sortedKeys: string[]
    if (elementKey === "Form") {
      // Это корневой элемент Form
      sortedKeys = FORM_ELEMENT_ORDER.filter((key) => allKeys.includes(key))
      const remainingKeys = allKeys.filter((key) => !FORM_ELEMENT_ORDER.includes(key)).sort()
      sortedKeys = [...sortedKeys, ...remainingKeys]
    } else if (allKeys.includes("v8:lang") && allKeys.includes("v8:content")) {
      // Для v8:item используем фиксированный порядок: сначала lang, потом content
      sortedKeys = V8_ITEM_ORDER.filter((key) => allKeys.includes(key))
      const remainingKeys = allKeys.filter((key) => !V8_ITEM_ORDER.includes(key)).sort()
      sortedKeys = [...sortedKeys, ...remainingKeys]
    } else {
      // Для всех остальных элементов сортируем свойства по алфавиту
      // (порядок элементов в ChildItems сохраняется, но свойства каждого элемента сортируются)
      sortedKeys = allKeys.sort()
    }

    for (const key of sortedKeys) {
      const value = element[key]

      // Рекурсивно обрабатываем значение
      if (key === "ChildItems") {
        // ChildItems может быть объектом с массивами элементов или массивом
        if (Array.isArray(value)) {
          // Если это массив, обрабатываем каждый элемент
          result[key] = value.map((item) => {
            const itemType = getElementType(item)
            return processElement(item, itemType)
          })
        } else if (value && typeof value === "object") {
          // Если это объект, обрабатываем каждый ключ (имя элемента) и его значения
          // Сохраняем порядок ключей из исходного объекта
          const childItemsResult: Record<string, any> = {}
          const childItemsKeys = Object.keys(value)
          for (const childKey of childItemsKeys) {
            const childValue = value[childKey]
            if (Array.isArray(childValue)) {
              // Если значение - массив, обрабатываем каждый элемент с именем элемента
              childItemsResult[childKey] = childValue.map((item) => processElement(item, childKey))
            } else if (childValue && typeof childValue === "object") {
              // Если значение - объект, обрабатываем его с именем элемента
              const processedChild = processElement(childValue, childKey)
              if (processedChild !== undefined) {
                childItemsResult[childKey] = processedChild
              }
            } else {
              childItemsResult[childKey] = childValue
            }
          }
          result[key] = childItemsResult
        } else {
          result[key] = value
        }
      } else if (key === "Attributes") {
        // Attributes может быть массивом или объектом с массивами
        if (Array.isArray(value)) {
          result[key] = value.map((item) => processElement(item, "Attribute"))
        } else if (value && typeof value === "object") {
          // Если это объект, обрабатываем каждый ключ (имя атрибута) и его значения
          const attributesResult: Record<string, any> = {}
          for (const attrKey of Object.keys(value)) {
            const attrValue = value[attrKey]
            if (Array.isArray(attrValue)) {
              attributesResult[attrKey] = attrValue.map((item) => processElement(item, "Attribute"))
            } else {
              attributesResult[attrKey] = processElement(attrValue, "Attribute")
            }
          }
          result[key] = attributesResult
        } else {
          result[key] = value
        }
      } else if (key === "Commands") {
        // Commands может быть массивом или объектом с массивами
        if (Array.isArray(value)) {
          result[key] = value.map((item) => processElement(item, "Command"))
        } else if (value && typeof value === "object") {
          // Если это объект, обрабатываем каждый ключ (имя команды) и его значения
          const commandsResult: Record<string, any> = {}
          for (const cmdKey of Object.keys(value)) {
            const cmdValue = value[cmdKey]
            if (Array.isArray(cmdValue)) {
              commandsResult[cmdKey] = cmdValue.map((item) => processElement(item, "Command"))
            } else {
              commandsResult[cmdKey] = processElement(cmdValue, "Command")
            }
          }
          result[key] = commandsResult
        } else {
          result[key] = value
        }
      } else {
        // Для остальных элементов рекурсивно обрабатываем
        const processedValue = processElement(value, key)
        if (processedValue !== undefined) {
          result[key] = processedValue
        }
      }
    }

    // Обрабатываем текстовое содержимое
    if (element["#text"] !== undefined) {
      result["#text"] = element["#text"]
    }

    // Если результат пустой, возвращаем исходный элемент (чтобы не потерять структуру)
    if (Object.keys(result).length === 0 && Object.keys(element).length > 0) {
      return element
    }

    return result
  }

  // Обрабатываем корневой элемент
  if (obj && typeof obj === "object") {
    if (obj.Form) {
      const processedForm = processElement(obj.Form, "Form")
      // Проверяем, что результат не пустой
      if (processedForm && Object.keys(processedForm).length > 0) {
        return { Form: processedForm }
      }
      return { Form: obj.Form }
    }
    const processed = processElement(obj)
    return processed && Object.keys(processed).length > 0 ? processed : obj
  }

  return obj
}
