import { XMLBuilder, XMLParser } from "fast-xml-parser"

const TARGET_UUID = "672124b6-9894-11e5-be38-001d42e813fe"

export function processXmlContent(xmlContent: string): string {
  const parsedData = parseXml(xmlContent)
  const processedData = processObject(parsedData)
  return buildXml(processedData)
}

function parseXml(xmlContent: string): any {
  const parser = new XMLParser({
    preserveOrder: false,
    ignoreAttributes: false,
    attributeNamePrefix: "",
    attributesGroupName: "@attributes",
    textNodeName: "#text",
    trimValues: true,
    parseTagValue: true,
    parseAttributeValue: false,
  })

  return parser.parse(xmlContent)
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

function processObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return undefined
  }

  // Если это примитив (строка, число, boolean), возвращаем как есть
  if (typeof obj !== "object") {
    return obj
  }

  // Если это массив, обрабатываем каждый элемент и создаем новый массив
  if (Array.isArray(obj)) {
    const processed = obj.map((item) => processObject(item)).filter((item) => !isEmptyNode(item))
    return processed.length > 0 ? processed : undefined
  }

  // Создаем новый объект для результата
  const result: Record<string, any> = {}

  // Обрабатываем атрибуты (создаем новый объект атрибутов)
  if (obj["@attributes"]) {
    const processedAttrs = processAttributes(obj["@attributes"])
    if (processedAttrs && Object.keys(processedAttrs).length > 0) {
      result["@attributes"] = processedAttrs
    }
  }

  // Обрабатываем остальные свойства (создаем новые значения)
  const sortedKeys = Object.keys(obj)
    .filter((key) => key !== "@attributes")
    .sort()

  for (const key of sortedKeys) {
    const originalValue = obj[key]

    // Заменяем UUID в полях TypeId/ValueId (создаем новое значение)
    const valueWithReplacedUuid = replaceUuidInValue(key, originalValue)

    // Рекурсивно обрабатываем значение (создаем новый объект)
    const processedValue = processObject(valueWithReplacedUuid)

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
  const sortedAttrs: Record<string, any> = {}
  const sortedKeys = Object.keys(attrs).sort()

  for (const key of sortedKeys) {
    const originalValue = attrs[key]
    const processedValue = replaceUuidInAttribute(key, originalValue)
    sortedAttrs[key] = processedValue
  }

  return Object.keys(sortedAttrs).length > 0 ? sortedAttrs : undefined
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
      return text === null || text === undefined || (typeof text === "string" && text.trim() === "")
    }
    // Если есть только @attributes и #text, проверяем оба
    if (keys.length === 2 && keys.includes("@attributes") && keys.includes("#text")) {
      const attrs = value["@attributes"]
      const text = value["#text"]
      const attrsEmpty = !attrs || Object.keys(attrs).length === 0
      const textEmpty = text === null || text === undefined || (typeof text === "string" && text.trim() === "")
      return attrsEmpty && textEmpty
    }
  }

  return false
}
