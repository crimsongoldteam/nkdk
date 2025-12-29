import { XMLBuilder, XMLParser } from "fast-xml-parser"

const TARGET_UUID = "11111111-1111-4111-8111-111111111111"

// Теги, внутри которых нужно сортировать дочерние элементы (без иерархии - только на первом уровне)
const SORTABLE_TAGS = [
  "Properties",
  "xr:Properties",
  "xr:StandardAttribute",
  "v8:item",
  "xr:CharacteristicTypes",
  "xr:CharacteristicValues",
]

export function processXmlContent(xmlContent: string): string {
  const parsedData = parseXml(xmlContent)
  const processedData = processObject(parsedData)
  return buildXml(processedData)
}

function parseXml(xmlContent: string): any {
  // Основные настройки парсера
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

  // Устанавливаем attributesGroupName через options (как в exporter.ts)
  // @ts-ignore
  builder.options.attributesGroupName = "@attributes"

  const outputXml = builder.build(parsedData)

  // Добавляем XML декларацию, если её нет
  if (!outputXml.trim().startsWith("<?xml")) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + outputXml
  }

  return outputXml
}

function processObject(obj: any, isPropertiesNode: boolean = false): any {
  if (obj === null || obj === undefined) {
    return undefined
  }

  // Если это примитив (строка, число, boolean), возвращаем как есть
  if (typeof obj !== "object") {
    return obj
  }

  // Если это массив, обрабатываем каждый элемент и создаем новый массив
  if (Array.isArray(obj)) {
    const processed = obj.map((item) => processObject(item, isPropertiesNode)).filter((item) => !isEmptyNode(item))
    return processed.length > 0 ? processed : undefined
  }

  // Создаем новый объект для результата
  const result: Record<string, any> = {}

  // Обрабатываем атрибуты
  if (obj["@attributes"]) {
    const processedAttrs = processAttributes(obj["@attributes"])
    if (processedAttrs) {
      result["@attributes"] = processedAttrs
    }
  }

  // Получаем все ключи (кроме @attributes)
  const allKeys = Object.keys(obj).filter((key) => key !== "@attributes")

  // Сортируем ключи только если мы находимся внутри ноды Properties (без иерархии - только на текущем уровне)
  const sortedKeys = isPropertiesNode ? allKeys.sort() : allKeys

  for (const key of sortedKeys) {
    const originalValue = obj[key]

    // Специальная обработка для FillValue: исключаем элементы без значения
    if ((key === "FillValue" || key === "xr:FillValue") && isEmptyFillValue(originalValue)) {
      continue
    }

    // Заменяем UUID в полях TypeId/ValueId (создаем новое значение)
    const valueWithReplacedUuid = replaceUuidInValue(key, originalValue)

    // Рекурсивно обрабатываем значение
    // Передаем isPropertiesNode=true только для прямых дочерних элементов сортируемых тегов (без иерархии)
    const nextIsProperties = !isPropertiesNode && (SORTABLE_TAGS.includes(key) || key.endsWith(":Properties"))
    const processedValue = processObject(valueWithReplacedUuid, nextIsProperties)

    // Пропускаем пустые ноды
    if (isEmptyNode(processedValue)) {
      continue
    }

    result[key] = processedValue
  }

  // Если объект пустой (нет атрибутов и нет свойств), возвращаем undefined
  if (Object.keys(result).length === 0) {
    return undefined
  }

  return result
}

function processAttributes(attrs: Record<string, any>): Record<string, any> | undefined {
  const processedAttrs: Record<string, any> = {}
  for (const key in attrs) {
    processedAttrs[key] = replaceUuidInAttribute(key, attrs[key])
  }
  return Object.keys(processedAttrs).length > 0 ? processedAttrs : undefined
}

function replaceUuidInAttribute(key: string, value: any): any {
  if (shouldReplaceUuid(key) && value) {
    return TARGET_UUID
  }
  return value
}

function replaceUuidInValue(key: string, value: any): any {
  if (!shouldReplaceUuid(key)) {
    return value
  }

  // Если значение - строка (UUID), возвращаем новую строку
  if (typeof value === "string" && value.trim()) {
    return TARGET_UUID
  }

  // Если значение - объект с текстовым содержимым (#text), создаем новый объект
  if (typeof value === "object" && value !== null && value["#text"]) {
    return { ...value, "#text": TARGET_UUID }
  }

  return value
}

function shouldReplaceUuid(key: string): boolean {
  return (
    key === "TypeId" ||
    key === "ValueId" ||
    key === "uuid" ||
    key.endsWith(":TypeId") ||
    key.endsWith(":ValueId") ||
    key.endsWith(":uuid")
  )
}

function isEmptyFillValue(value: any): boolean {
  if (value === null || value === undefined) {
    return true
  }
  if (typeof value === "string") {
    return value.trim() === ""
  }
  if (typeof value === "object") {
    const text = value["#text"]
    return text === undefined || text === null || (typeof text === "string" && text.trim() === "")
  }
  return false
}

function isEmptyNode(value: any): boolean {
  if (value === null || value === undefined) {
    return true
  }

  if (typeof value === "string" && value.trim() === "") {
    return true
  }

  if (Array.isArray(value)) {
    return value.length === 0
  }

  if (typeof value === "object") {
    const keys = Object.keys(value)

    // Проверяем наличие атрибута xsi:nil="true"
    if (value["@attributes"]) {
      const attrs = value["@attributes"]
      // Проверяем все ключи атрибутов, которые могут содержать "nil"
      for (const attrKey of Object.keys(attrs)) {
        if (attrKey.endsWith(":nil") || attrKey === "nil") {
          const nilValue = attrs[attrKey]
          if (nilValue === "true" || nilValue === true) {
            return true
          }
        }
      }
    }

    // Если есть только атрибуты, но они пустые, или нет вообще свойств
    if (keys.length === 0) {
      return true
    }
    // Если есть только @attributes, проверяем, не пустые ли они
    if (keys.length === 1 && keys[0] === "@attributes") {
      const attrs = value["@attributes"]
      return !attrs || Object.keys(attrs).length === 0
    }
    // Если есть только #text и он пустой, считаем ноду пустой
    if (keys.length === 1 && keys[0] === "#text") {
      const text = value["#text"]
      return !text || (typeof text === "string" && text.trim() === "")
    }
    // Если есть только @attributes и #text, проверяем оба
    if (keys.length === 2 && keys.includes("@attributes") && keys.includes("#text")) {
      const attrs = value["@attributes"]
      const text = value["#text"]
      return (!attrs || Object.keys(attrs).length === 0) && (!text || (typeof text === "string" && text.trim() === ""))
    }
  }

  return false
}
