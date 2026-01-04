import { XMLBuilder, XMLParser } from "fast-xml-parser"

const TARGET_UUID = "11111111-1111-4111-8111-111111111111"

// Стандартные атрибуты для MetaDataObject
const METADATA_OBJECT_ATTRIBUTES = {
  "xmlns:app": "http://v8.1c.ru/8.2/managed-application/core",
  "xmlns:cfg": "http://v8.1c.ru/8.1/data/enterprise/current-config",
  "xmlns:cmi": "http://v8.1c.ru/8.2/managed-application/cmi",
  "xmlns:ent": "http://v8.1c.ru/8.1/data/enterprise",
  "xmlns:lf": "http://v8.1c.ru/8.2/managed-application/logform",
  "xmlns:style": "http://v8.1c.ru/8.1/data/ui/style",
  "xmlns:sys": "http://v8.1c.ru/8.1/data/ui/fonts/system",
  "xmlns:v8": "http://v8.1c.ru/8.1/data/core",
  "xmlns:v8ui": "http://v8.1c.ru/8.1/data/ui",
  "xmlns:web": "http://v8.1c.ru/8.1/data/ui/colors/web",
  "xmlns:win": "http://v8.1c.ru/8.1/data/ui/colors/windows",
  "xmlns:xen": "http://v8.1c.ru/8.3/xcf/enums",
  "xmlns:xpr": "http://v8.1c.ru/8.3/xcf/predef",
  "xmlns:xr": "http://v8.1c.ru/8.3/xcf/readable",
  "xmlns:xs": "http://www.w3.org/2001/XMLSchema",
  "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
  xmlns: "http://v8.1c.ru/8.3/MDClasses",
  version: "2.20",
}

// Теги, внутри которых нужно сортировать дочерние элементы (без иерархии - только на первом уровне)
const SORTABLE_TAGS = [
  "Properties",
  "xr:Properties",
  "xr:StandardAttribute",
  "v8:item",
  "xr:CharacteristicTypes",
  "xr:CharacteristicValues",
  "v8:StringQualifiers",
  "v8:NumberQualifiers",
  "v8:DateQualifiers",
  "xr:Link",
]

export function cleanXml(xmlContent: string): string {
  const parsedData = parseXml(xmlContent)
  // Добавляем стандартные атрибуты к MetaDataObject, если он присутствует
  const dataWithAttributes = ensureMetaDataObjectAttributes(parsedData)
  const processedData = processObject(dataWithAttributes)
  return buildXml(processedData)
}

function ensureMetaDataObjectAttributes(parsedData: any): any {
  // Проверяем, есть ли корневой элемент MetaDataObject
  if (parsedData && typeof parsedData === "object" && parsedData.MetaDataObject) {
    const metaDataObject = parsedData.MetaDataObject

    // Инициализируем @attributes, если их нет
    if (!metaDataObject["@attributes"]) {
      metaDataObject["@attributes"] = {}
    }

    // Используем стандартные атрибуты из METADATA_OBJECT_ATTRIBUTES
    metaDataObject["@attributes"] = { ...METADATA_OBJECT_ATTRIBUTES }
  }

  return parsedData
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

  return outputXml.trimEnd()
}

function processObject(obj: any, isPropertiesNode: boolean = false, parentKey: string = ""): any {
  if (obj === null || obj === undefined) {
    return undefined
  }

  // Если это примитив (строка, число, boolean), возвращаем как есть
  if (typeof obj !== "object") {
    return obj
  }

  // Если это массив, обрабатываем каждый элемент и создаем новый массив
  // Если родительский ключ находится в SORTABLE_TAGS или заканчивается на :Properties, то элементы массива должны сортироваться
  if (Array.isArray(obj)) {
    const shouldSortItems = SORTABLE_TAGS.includes(parentKey) || parentKey.endsWith(":Properties")
    const processed = obj
      .map((item) => processObject(item, shouldSortItems, parentKey))
      .filter((item) => !isEmptyNode(item))

    // Специальная сортировка для массивов Form и Template по алфавиту
    if (parentKey === "Form" || parentKey === "Template") {
      processed.sort((a, b) => {
        const textA = extractTextFromElement(a)
        const textB = extractTextFromElement(b)
        return textA.localeCompare(textB, "ru")
      })
    }

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
    const processedValue = processObject(valueWithReplacedUuid, nextIsProperties, key)

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

/**
 * Извлекает текстовое содержимое из элемента Form или Template
 * Элемент может быть строкой или объектом с #text
 */
function extractTextFromElement(element: any): string {
  if (typeof element === "string") {
    return element
  }
  if (typeof element === "object" && element !== null) {
    if (element["#text"]) {
      return String(element["#text"])
    }
    // Если это объект без #text, пытаемся найти текстовое содержимое
    const keys = Object.keys(element).filter((key) => key !== "@attributes")
    if (keys.length === 1 && typeof element[keys[0]] === "string") {
      return element[keys[0]]
    }
  }
  return ""
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
