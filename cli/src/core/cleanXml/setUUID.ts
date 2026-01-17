import { CleanContext } from "./types.js"

const TARGET_UUID = "11111111-1111-4111-8111-111111111111"

export const setUUID = (context: CleanContext, parsedData: any): any => {
  return processObject(parsedData)
}

function processObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj
  }

  // Если это примитив (строка, число, boolean), возвращаем как есть
  if (typeof obj !== "object") {
    return obj
  }

  // Если это массив, обрабатываем каждый элемент
  if (Array.isArray(obj)) {
    return obj.map((item) => processObject(item))
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

  // Обрабатываем все ключи (кроме @attributes)
  const allKeys = Object.keys(obj).filter((key) => key !== "@attributes")

  for (const key of allKeys) {
    const originalValue = obj[key]

    // Заменяем UUID в полях TypeId/ValueId/uuid (создаем новое значение)
    const valueWithReplacedUuid = replaceUuidInValue(key, originalValue)

    // Рекурсивно обрабатываем значение
    const processedValue = processObject(valueWithReplacedUuid)

    result[key] = processedValue
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
