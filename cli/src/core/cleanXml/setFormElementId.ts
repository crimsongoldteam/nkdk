import type { CleanContext } from "./types.js"

export const setFormElementId = (context: CleanContext, parsedData: any): any => {
  let idCounter = 1

  const process = (data: any): any => {
    if (data === null || data === undefined) {
      return data
    }

    if (Array.isArray(data)) {
      return data
        .map((item) => process(item))
        .filter((item) => item !== undefined)
    }

    if (typeof data !== "object") {
      return data
    }

    const tagName = Object.keys(data).find((k) => k !== ":@")
    if (!tagName || tagName === "#text") {
      return data
    }

    const children = data[tagName]
    const attributes = data[":@"]

    let newAttributes = attributes ? { ...attributes } : undefined

    // Перенумеровываем id, если он есть, и это не AutoCommandBar с id="-1"
    if (newAttributes && newAttributes.id !== undefined) {
      const isAutoCommandBarSpecial = tagName === "AutoCommandBar" && String(newAttributes.id) === "-1"
      if (!isAutoCommandBarSpecial) {
        newAttributes.id = String(idCounter++)
      }
    }

    return {
      ...data,
      [tagName]: process(children),
      ...(newAttributes ? { ":@": newAttributes } : {}),
    }
  }

  return process(parsedData)
}
