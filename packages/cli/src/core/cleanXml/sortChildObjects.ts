import type { CleanContext } from "./types"

/**
 * Извлекает текстовое значение из объекта с fast-xml-parser структурой
 * Например: [{ "#text": "значение" }] -> "значение"
 */
const getTextValue = (obj: any): string => {
  if (obj == null) {
    return ""
  }
  if (typeof obj === "string") {
    return obj
  }
  if (Array.isArray(obj) && obj.length > 0) {
    return getTextValue(obj[0])
  }
  if (typeof obj === "object" && obj["#text"] != null) {
    return String(obj["#text"])
  }
  return String(obj)
}

/**
 * Извлекает имя из объекта с учетом структуры fast-xml-parser
 * Name может быть: [{ "#text": "Имя" }] или просто строкой
 */
const getName = (obj: any): string => {
  if (obj == null || typeof obj !== "object") {
    return ""
  }
  // Прямое поле Name
  if (obj.Name != null) {
    return getTextValue(obj.Name)
  }
  // Name внутри Properties
  if (obj.Properties != null) {
    // Properties - это массив
    if (Array.isArray(obj.Properties)) {
      for (const prop of obj.Properties) {
        if (prop.Name != null) {
          return getTextValue(prop.Name)
        }
      }
    } else if (obj.Properties.Name != null) {
      return getTextValue(obj.Properties.Name)
    }
  }
  return ""
}

/**
 * Сортирует массив строковых значений
 */
const sortStringArray = (arr: any[]): any[] =>
  [...arr].sort((a, b) => {
    const textA = getTextValue(a)
    const textB = getTextValue(b)
    return textA.localeCompare(textB, "ru")
  })

/**
 * Сортирует массив объектов по полю Name (если оно есть)
 */
const sortByName = (arr: any[], context: CleanContext): any[] => {
  if (!Array.isArray(arr) || arr.length === 0) {
    return arr
  }

  // Проверяем, есть ли у объектов поле Name
  const hasName = arr.some(
    (item) =>
      item != null &&
      typeof item === "object" &&
      (item.Name != null ||
        (item.Properties != null &&
          (Array.isArray(item.Properties)
            ? item.Properties.some((p: any) => p.Name != null)
            : item.Properties.Name != null)))
  )

  if (!hasName) {
    return arr.map((item) => sortChildObjects(context, item))
  }

  // Сортируем по Name
  const sorted = [...arr].sort((a, b) => {
    const nameA = getName(a)
    const nameB = getName(b)
    return nameA.localeCompare(nameB, "ru")
  })

  return sorted.map((item) => sortChildObjects(context, item))
}

export const sortChildObjects = (context: CleanContext, parsedData: any): any => {
  if (parsedData == null || typeof parsedData !== "object") {
    return parsedData
  }

  if (Array.isArray(parsedData)) {
    return parsedData.map((item) => sortChildObjects(context, item))
  }

  const result: Record<string, any> = {}

  for (const key of Object.keys(parsedData)) {
    const value = parsedData[key]

    if (key === "ChildObjects" && value != null && typeof value === "object") {
      // ChildObjects - это массив объектов, а не Record
      if (Array.isArray(value)) {
        // Группируем элементы по типу (Form, Template, Attribute и т.д.)
        const grouped: Record<string, any[]> = {}
        for (const item of value) {
          if (item == null || typeof item !== "object") continue
          const itemKey = Object.keys(item).find((k) => k !== ":@")
          if (itemKey) {
            if (!grouped[itemKey]) {
              grouped[itemKey] = []
            }
            grouped[itemKey].push(item)
          }
        }

        // Определяем порядок типов: сначала Attribute, TabularSection (по алфавиту), потом Form, Template, Command
        // Согласно after.xml: Form и Template идут до Command
        const typeOrder: Record<string, number> = {
          Attribute: 1,
          TabularSection: 2,
          Form: 3,
          Template: 4,
          Command: 5,
        }

        // Сортируем ключи с учетом порядка типов
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
          const orderA = typeOrder[a] || 100
          const orderB = typeOrder[b] || 100
          if (orderA !== orderB) {
            return orderA - orderB
          }
          return a.localeCompare(b)
        })

        const processed: any[] = []
        for (const childType of sortedKeys) {
          const childValue = grouped[childType]
          // Сортируем массивы строк для Form и Template
          const shouldSort = childType === "Form" || childType === "Template"
          if (shouldSort) {
            // Для Form и Template сортируем по текстовому значению
            const sortedItems = [...childValue].sort((a, b) => {
              const textA = getTextValue(a[childType])
              const textB = getTextValue(b[childType])
              return textA.localeCompare(textB, "ru")
            })
            processed.push(...sortedItems.map((item) => sortChildObjects(context, item)))
          } else {
            // Для массивов объектов (Attribute, Command и т.д.) сортируем по Name
            const sortedItems = sortByName(childValue, context)
            processed.push(...sortedItems)
          }
        }
        result[key] = processed
      } else {
        // Если ChildObjects - объект (не массив), обрабатываем как раньше
        const processed: Record<string, any> = {}
        const sortedKeys = Object.keys(value).sort((a, b) => a.localeCompare(b))
        for (const childType of sortedKeys) {
          const childValue = value[childType]
          const shouldSort = (childType === "Form" || childType === "Template") && Array.isArray(childValue)
          if (shouldSort) {
            processed[childType] = sortStringArray(childValue)
          } else if (Array.isArray(childValue)) {
            processed[childType] = sortByName(childValue, context)
          } else {
            processed[childType] = sortChildObjects(context, childValue)
          }
        }
        result[key] = processed
      }
      continue
    }

    result[key] = sortChildObjects(context, value)
  }

  return result
}
