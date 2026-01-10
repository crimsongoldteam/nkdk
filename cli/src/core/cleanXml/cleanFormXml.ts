import { XMLBuilder, XMLParser } from "fast-xml-parser"
import { SORTABLE_TAGS } from "./cleanXml.js"

export function prepareFormXml(xmlContent: string): string {
  const parsedData = parseXml(xmlContent)
  const processedData = parsedData.Form
    ? { Form: processFormElement(parsedData.Form, "Form") }
    : processFormElement(parsedData)
  const renumberedData = renumberIds(processedData)
  return buildXml(renumberedData)
}

function parseXml(xmlContent: string): any {
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

  // @ts-ignore
  builder.options.attributesGroupName = "@attributes"

  const outputXml = builder.build(parsedData)

  if (!outputXml || !outputXml.trim().startsWith("<?xml")) {
    const content = outputXml && outputXml.trim() ? outputXml : ""
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + content
  }

  return outputXml.trimEnd()
}

const FORM_ELEMENT_ORDER = ["Title", "AutoTitle", "AutoCommandBar", "Events", "ChildItems", "Attributes", "Commands"]
const COMMAND_ELEMENT_ORDER = ["Title", "ToolTip", "Action", "CurrentRowUse"]
const V8_ITEM_ORDER = ["v8:lang", "v8:content"]

function getSortedKeys(allKeys: string[], parentKey: string): string[] {
  if (parentKey === "Form") {
    const ordered = FORM_ELEMENT_ORDER.filter((key) => allKeys.includes(key))
    const remaining = allKeys.filter((key) => !FORM_ELEMENT_ORDER.includes(key)).sort()
    return [...ordered, ...remaining]
  }

  if (parentKey === "Commands" && allKeys.some((key) => COMMAND_ELEMENT_ORDER.includes(key))) {
    const ordered = COMMAND_ELEMENT_ORDER.filter((key) => allKeys.includes(key))
    const remaining = allKeys.filter((key) => !COMMAND_ELEMENT_ORDER.includes(key)).sort()
    return [...ordered, ...remaining]
  }

  if (allKeys.includes("v8:lang") && allKeys.includes("v8:content")) {
    const ordered = V8_ITEM_ORDER.filter((key) => allKeys.includes(key))
    const remaining = allKeys.filter((key) => !V8_ITEM_ORDER.includes(key)).sort()
    return [...ordered, ...remaining]
  }

  return allKeys.sort()
}

function processArray(arr: any[], parentKey: string, processor: (item: any, key: string) => any): any[] | undefined {
  const shouldSort =
    (SORTABLE_TAGS.includes(parentKey) || parentKey.endsWith(":Properties")) && parentKey !== "ChildItems"
  const processed = arr.map((item) => processor(item, parentKey))

  if (shouldSort) {
    processed.sort((a, b) => {
      const keyA = getElementKey(a)
      const keyB = getElementKey(b)
      return keyA.localeCompare(keyB, "ru")
    })
  }

  return processed.length > 0 ? processed : undefined
}

function processChildItems(value: any, processor: (item: any, key: string) => any): any {
  if (Array.isArray(value)) {
    return value.map((item) => processor(item, "ChildItems"))
  }

  if (value && typeof value === "object") {
    const result: Record<string, any> = {}
    // Сохраняем порядок ключей из исходного объекта
    const childItemsKeys = Object.keys(value)
    for (const childKey of childItemsKeys) {
      const childValue = value[childKey]
      if (Array.isArray(childValue)) {
        // Сохраняем порядок элементов в массиве
        result[childKey] = childValue.map((item) => processor(item, "ChildItems"))
      } else if (childValue && typeof childValue === "object") {
        // Обрабатываем элемент, сохраняя его даже если обработка вернула undefined или пустой объект
        const processed = processor(childValue, "ChildItems")
        // Всегда сохраняем элемент, даже если обработка вернула undefined или пустой объект
        // (элемент может содержать только атрибуты или быть пустым)
        // Всегда сохраняем элемент, даже если обработка вернула undefined или пустой объект
        // (элемент может содержать только атрибуты или быть пустым)
        if (processed === undefined) {
          result[childKey] = childValue
        } else if (typeof processed === "object" && !Array.isArray(processed) && Object.keys(processed).length === 0) {
          // Если обработка вернула пустой объект, сохраняем исходный элемент
          result[childKey] = childValue
        } else {
          // Сохраняем обработанный элемент
          result[childKey] = processed
        }
      } else {
        result[childKey] = childValue
      }
    }
    return result
  }

  return value
}

function processFormElement(obj: any, parentKey: string = ""): any {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return obj
  }

  if (Array.isArray(obj)) {
    return processArray(obj, parentKey, processFormElement)
  }

  const result: Record<string, any> = {}

  if (obj["@attributes"]) {
    result["@attributes"] = obj["@attributes"]
  }

  const allKeys = Object.keys(obj).filter((key) => key !== "@attributes")
  const sortedKeys = getSortedKeys(allKeys, parentKey)

  for (const key of sortedKeys) {
    const value = obj[key]

    if (key === "ChildItems") {
      const processedChildItems = processChildItems(value, processFormElement)
      // Всегда сохраняем ChildItems, даже если обработка вернула undefined
      // (ChildItems может содержать только атрибуты или быть пустым)
      if (processedChildItems !== undefined) {
        result[key] = processedChildItems
      } else if (value !== undefined) {
        // Если обработка вернула undefined, сохраняем исходное значение
        result[key] = value
      }
    } else {
      const processed = processFormElement(value, key)
      if (processed !== undefined) {
        result[key] = processed
      }
    }
  }

  return Object.keys(result).length > 0 ? result : undefined
}

function getElementKey(element: any): string {
  if (typeof element === "string") {
    return element
  }
  if (typeof element === "object" && element !== null) {
    if (element["@attributes"]?.name) {
      return element["@attributes"].name
    }
    if (element["#text"]) {
      return String(element["#text"])
    }
    const keys = Object.keys(element).filter((key) => key !== "@attributes")
    if (keys.length > 0) {
      return keys[0]
    }
  }
  return ""
}

function getElementType(element: any): string | undefined {
  if (typeof element === "object" && element !== null && !Array.isArray(element)) {
    const keys = Object.keys(element).filter((key) => key !== "@attributes" && key !== "#text")
    return keys[0]
  }
  return undefined
}

function renumberIds(obj: any): any {
  let idCounter = 1

  function shouldSkipRenumbering(element: any, elementKey?: string): boolean {
    return (
      elementKey === "AutoCommandBar" &&
      element?.["@attributes"]?.id === "-1" &&
      typeof element === "object" &&
      !Array.isArray(element)
    )
  }

  function processValue(value: any, key: string, elementKey?: string): any {
    if (Array.isArray(value)) {
      return value.map((item) => {
        const itemType = getElementType(item)
        return processElement(item, itemType || key)
      })
    }

    if (value && typeof value === "object") {
      if (key === "ChildItems") {
        // Сохраняем порядок элементов в ChildItems
        return processChildItems(value, (item, k) => {
          const itemType = getElementType(item)
          const processed = processElement(item, itemType || k)
          // Всегда возвращаем элемент, даже если обработка вернула пустой объект
          // (элемент может содержать только атрибуты)
          // Если processed undefined или пустой объект, но исходный элемент не пустой, возвращаем исходный
          if (processed === undefined) {
            return item
          }
          // Если processed пустой объект, но исходный элемент имеет атрибуты или свойства, возвращаем исходный
          if (
            typeof processed === "object" &&
            !Array.isArray(processed) &&
            Object.keys(processed).length === 0 &&
            item &&
            typeof item === "object" &&
            !Array.isArray(item) &&
            (Object.keys(item).length > 0 || item["@attributes"])
          ) {
            return item
          }
          return processed
        })
      }

      if (key === "Attributes") {
        const result: Record<string, any> = {}
        for (const attrKey of Object.keys(value)) {
          const attrValue = value[attrKey]
          if (Array.isArray(attrValue)) {
            result[attrKey] = attrValue.map((item) => processElement(item, "Attribute"))
          } else {
            result[attrKey] = processElement(attrValue, "Attribute")
          }
        }
        return result
      }

      if (key === "Commands") {
        const result: Record<string, any> = {}
        for (const cmdKey of Object.keys(value)) {
          const cmdValue = value[cmdKey]
          if (Array.isArray(cmdValue)) {
            result[cmdKey] = cmdValue.map((item) => processElement(item, "Command"))
          } else {
            result[cmdKey] = processElement(cmdValue, "Command")
          }
        }
        return result
      }

      return processElement(value, key)
    }

    return value
  }

  function processElement(element: any, elementKey?: string): any {
    if (element === null || element === undefined || typeof element !== "object") {
      return element
    }

    if (Array.isArray(element)) {
      return element.map((item) => {
        const itemType = getElementType(item)
        return processElement(item, itemType)
      })
    }

    const result: Record<string, any> = {}

    if (element["@attributes"]) {
      const attrs = { ...element["@attributes"] }
      if (attrs.id !== undefined && !shouldSkipRenumbering(element, elementKey)) {
        attrs.id = String(idCounter++)
      }
      result["@attributes"] = attrs
    }

    const allKeys = Object.keys(element).filter((key) => key !== "@attributes" && key !== "#text")
    const sortedKeys = getSortedKeys(allKeys, elementKey || "")

    for (const key of sortedKeys) {
      const value = element[key]
      const processed = processValue(value, key, elementKey)
      if (processed !== undefined) {
        result[key] = processed
      }
    }

    if (element["#text"] !== undefined) {
      result["#text"] = element["#text"]
    }

    return Object.keys(result).length > 0 ? result : element
  }

  if (obj && typeof obj === "object") {
    if (obj.Form) {
      const processedForm = processElement(obj.Form, "Form")
      return { Form: Object.keys(processedForm).length > 0 ? processedForm : obj.Form }
    }
    const processed = processElement(obj)
    return Object.keys(processed).length > 0 ? processed : obj
  }

  return obj
}
