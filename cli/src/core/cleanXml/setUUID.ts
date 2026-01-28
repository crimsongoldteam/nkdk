import type { CleanContext } from "./types.js"

const TARGET_UUID = "11111111-1111-4111-8111-111111111111"

export const setUUID = (context: CleanContext, parsedData: any): any => {
  const process = (data: any): any => {
    if (data === null || data === undefined) {
      return data
    }

    if (Array.isArray(data)) {
      return data.map((item) => process(item)).filter((item) => item !== undefined)
    }

    if (typeof data !== "object") {
      return data
    }

    const tagName = Object.keys(data).find((k) => k !== ":@")
    if (!tagName || tagName === "#text") {
      return data
    }

    const children = data[tagName]
    const processedChildren = process(children)

    return {
      ...data,
      [tagName]: processedChildren,
    }
  }

  return process(parsedData)
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
  return (
    key === "TypeId" ||
    key === "ValueId" ||
    key === "uuid" ||
    key.endsWith(":TypeId") ||
    key.endsWith(":ValueId") ||
    key.endsWith(":uuid")
  )
}
