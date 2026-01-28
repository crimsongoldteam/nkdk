import type { CleanContext } from "./types.js"

/**
 * Удаляет пустые ноды из объекта.
 * Пустые ноды - это:
 * 1. Пустые строки ""
 * 2. Пустые массивы []
 * 3. Объекты без дочерних элементов и без значимых атрибутов
 * 4. Объекты с атрибутом xsi:nil="true"
 *
 * Оставляет ноды с атрибутами (кроме xsi:nil="true") и текстовыми нодами.
 */
export const removeEmptyNodes = (context: CleanContext, parsedData: any): any => {
  if (parsedData === null || parsedData === undefined) {
    return parsedData
  }

  // Обрабатываем массивы
  if (Array.isArray(parsedData)) {
    const result = []
    for (const item of parsedData) {
      const processed = removeEmptyNodes(context, item)
      if (processed === undefined || processed === null) continue
      if (Array.isArray(processed) && processed.length === 0) continue
      result.push(processed)
    }
    return result
  }

  // Примитивные значения оставляем как есть
  if (typeof parsedData !== "object") {
    return parsedData
  }

  // Объекты с текстовым содержимым #text
  if (parsedData.hasOwnProperty("#text")) {
    const text = parsedData["#text"]
    // Если текст пустой - удаляем всю ноду
    if (text === null || text === undefined || text === "") {
      return undefined
    }
    return parsedData
  }

  const result: any = {}
  let hasContent = false

  for (const [key, value] of Object.entries(parsedData)) {
    if (key === ":@") {
      // Сохраняем атрибуты
      result[key] = value
    } else {
      const processed = removeEmptyNodes(context, value)
      if (processed !== undefined && processed !== null && !(Array.isArray(processed) && processed.length === 0)) {
        result[key] = processed
        hasContent = true
      }
    }
  }

  // Если нет контента (дочерних элементов)
  if (!hasContent) {
    const attrs = result[":@"]

    // Если есть атрибут xsi:nil="true" - удаляем ноду полностью
    if (attrs && attrs["@_xsi:nil"] === "true") {
      return undefined
    }

    // Если есть атрибут xsi:type и нет контента - удаляем ноду полностью
    if (attrs && attrs["@_xsi:type"]) {
      return undefined
    }

    // Находим имя тега из исходных данных
    const tagName = Object.keys(parsedData).find((k) => k !== ":@")

    // Special handling for ?xml declaration - always keep it
    if (tagName === "?xml") {
      return {
        "?xml": [{ "#text": "" }],
        ":@": attrs,
      }
    }

    if (tagName && attrs && Object.keys(attrs).length > 0) {
      // Возвращаем объект с пустым массивом для сохранения тега
      return {
        [tagName]: [],
        ":@": attrs,
      }
    }

    // Нет ни контента, ни значимых атрибутов - удаляем
    return undefined
  }

  return result
}
