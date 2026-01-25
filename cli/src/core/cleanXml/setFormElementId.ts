import type { CleanContext } from "./types.js"

export const setFormElementId = (context: CleanContext, parsedData: any): any => {
  // Don't renumber IDs - keep them as they are in the input
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
    const processedChildren = process(children)

    return {
      ...data,
      [tagName]: processedChildren,
    }
  }

  return process(parsedData)
}
