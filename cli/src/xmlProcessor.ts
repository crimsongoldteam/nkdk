import { XMLBuilder, XMLParser } from "fast-xml-parser"

const TARGET_UUID = "11111111-1111-4111-8111-111111111111"

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

  // Пробуем основной парсер
  try {
    const parser = new XMLParser(primaryOptions)
    return parser.parse(xmlContent)
  } catch (error) {
    // Если не получилось, пробуем с preserveOrder: true (как в importer.ts)
    try {
      const fallbackParser = new XMLParser({
        ...primaryOptions,
        preserveOrder: true,
      })
      return fallbackParser.parse(xmlContent)
    } catch (fallbackError) {
      // Если и это не помогло, пробуем еще более мягкие настройки
      try {
        const softParser = new XMLParser({
          preserveOrder: true,
          ignoreAttributes: false,
          attributeNamePrefix: "",
          attributesGroupName: "@attributes",
          textNodeName: "#text",
          trimValues: false,
          parseTagValue: false,
          parseAttributeValue: false,
        })
        return softParser.parse(xmlContent)
      } catch (softError) {
        // Если все попытки не удались, выбрасываем оригинальную ошибку
        const errorMessage = error instanceof Error ? error.message : String(error)
        throw new Error(`Ошибка парсинга XML: ${errorMessage}`)
      }
    }
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

    // Специальная обработка для FillValue: исключаем элементы без значения
    if (key === "FillValue" || key === "xr:FillValue") {
      // Если это объект, проверяем наличие текстового содержимого
      if (typeof originalValue === "object" && originalValue !== null) {
        const hasText =
          originalValue["#text"] !== undefined &&
          originalValue["#text"] !== null &&
          (typeof originalValue["#text"] !== "string" || originalValue["#text"].trim() !== "")
        // Если нет текстового содержимого, пропускаем элемент
        if (!hasText) {
          continue
        }
      }
      // Если это примитив (строка), проверяем, что она не пустая
      if (typeof originalValue === "string" && originalValue.trim() === "") {
        continue
      }
      // Если это null или undefined, пропускаем
      if (originalValue === null || originalValue === undefined) {
        continue
      }
    }

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
