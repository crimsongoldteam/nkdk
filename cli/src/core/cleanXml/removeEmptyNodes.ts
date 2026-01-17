import type { CleanContext } from "./types.js"

export const removeEmptyNodes = (context: CleanContext, parsedData: any): any => {
  if (parsedData === null || parsedData === undefined) {
    return undefined
  }

  // Если это примитив, возвращаем как есть
  if (typeof parsedData !== "object") {
    return parsedData
  }

  // Если это массив, обрабатываем каждый элемент
  if (Array.isArray(parsedData)) {
    const processed = parsedData.map((item) => removeEmptyNodes(context, item)).filter((item) => !isEmptyNode(item))
    return processed.length > 0 ? processed : undefined
  }

  // Создаем новый объект для результата
  const result: Record<string, any> = {}

  // Сохраняем атрибуты, если они есть
  if (parsedData["@attributes"]) {
    result["@attributes"] = parsedData["@attributes"]
  }

  // Обрабатываем все ключи кроме @attributes
  const allKeys = Object.keys(parsedData).filter((key) => key !== "@attributes")

  for (const key of allKeys) {
    const value = parsedData[key]
    const processedValue = removeEmptyNodes(context, value)

    // Пропускаем пустые ноды, но не удаляем v8:content
    if (key === "v8:content") {
      // Сохраняем v8:content даже если он пустой
      result[key] = processedValue !== undefined ? processedValue : {}
    } else if (!isEmptyNode(processedValue)) {
      result[key] = processedValue
    }
  }

  // Если объект пустой (нет атрибутов и нет свойств), возвращаем undefined
  if (Object.keys(result).length === 0) {
    return undefined
  }

  return result
}

const isEmptyNode = (value: any): boolean => {
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
