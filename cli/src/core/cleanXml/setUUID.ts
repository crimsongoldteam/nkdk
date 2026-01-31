import type { CleanContext } from "./types"

const TARGET_UUID = "11111111-1111-4111-8111-111111111111"

export const setUUID = (context: CleanContext, parsedData: any): any => {
  return process(parsedData, { id: 1 })
}

const process = (data: any, params: { id: number }): any => {
  if (data === null || data === undefined) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => process(item, params)).filter((item) => item !== undefined)
  }

  if (typeof data !== "object") {
    return data
  }

  const attributes = data[":@"]

  if (attributes !== undefined && typeof attributes === "object") {
    for (const key of Object.keys(attributes)) {
      if (shouldReplaceUuid(key) && attributes[key]) {
        attributes[key] = TARGET_UUID
      }
    }
  }

  const tagName = Object.keys(data).find((k) => k !== ":@")
  if (!tagName) {
    return data
  }

  // Если это текстовый узел с UUID для замены
  if (tagName === "#text") {
    const textValue = data[tagName]
    if (typeof textValue === "string" && data[":@"] && shouldReplaceUuid(Object.keys(data[":@"])[0] || "")) {
      return { ...data, [tagName]: TARGET_UUID }
    }
    return data
  }

  // Если тег сам является UUID для замены (например, xr:TypeId, xr:ValueId)
  if (shouldReplaceUuid(tagName)) {
    const children = data[tagName]
    // Если дети - пустой массив или массив с текстовым узлом, заменяем на TARGET_UUID
    if (
      Array.isArray(children) &&
      (children.length === 0 || (children.length === 1 && children[0]["#text"] !== undefined))
    ) {
      return {
        ...data,
        [tagName]: [{ "#text": TARGET_UUID }],
      }
    }
    const processedChildren = process(children, params)
    return { ...data, [tagName]: processedChildren }
  }

  const children = data[tagName]
  const processedChildren = process(children, params)

  return {
    ...data,
    [tagName]: processedChildren,
  }
}

// export const setUUID = (context: CleanContext, parsedData: any): any => {
//   const process = (data: any): any => {
//     if (data === null || data === undefined) {
//       return data
//     }

//     if (Array.isArray(data)) {
//       return data
//         .map((item) => process(item))
//         .filter((item) => item !== undefined)
//     }

//     if (typeof data !== "object") {
//       return data
//     }

//     const tagName = Object.keys(data).find((k) => !k.startsWith("@_") && k !== "#text")
//     if (!tagName || tagName === "#text") {
//       return data
//     }

//     const children = data[tagName]
//     const attributes: Record<string, any> = {}
//     const cleanChildren: Record<string, any> = {}

//     for (const key in children) {
//       if (key.startsWith("@_")) {
//         attributes[key.slice(2)] = children[key]
//       } else {
//         cleanChildren[key] = children[key]
//       }
//     }

//     let newAttributes = { ...attributes }

//     // Заменяем UUID в атрибутах
//     for (const key in newAttributes) {
//       if (shouldReplaceUuid(key) && newAttributes[key]) {
//         newAttributes[key] = TARGET_UUID
//       }
//     }

//     // Обрабатываем детей
//     let processedChildren = process(cleanChildren)

//     // Заменяем текст для специальных тегов
//     if (tagName === "xr:TypeId" || tagName === "xr:ValueId" || tagName === "uuid") {
//       if (typeof processedChildren === "string") {
//         processedChildren = TARGET_UUID
//       }
//     }

//     // Создаем новый объект с обновленными атрибутами
//     const result: any = { [tagName]: processedChildren }
//     for (const key in newAttributes) {
//       result[`@_${key}`] = newAttributes[key]
//     }

//     return result
//   }

//   return process(parsedData)
// }

function shouldReplaceUuid(key: string): boolean {
  return key.endsWith("TypeId") || key.endsWith("ValueId") || key.endsWith("uuid")
}
