import type { CleanContext } from "./types.js"

export const removeEmptyNodes = (context: CleanContext, parsedData: any): any => {
  if (parsedData === null || parsedData === undefined) {
    return parsedData
  }

  if (Array.isArray(parsedData)) {
    const processed = parsedData
      .map((item) => removeEmptyNodes(context, item))
      .filter((item) => item !== undefined && item !== null && item !== "")
    return processed.length > 0 ? processed : []
  }

  if (typeof parsedData !== "object") {
    return parsedData
  }

  // Handle objects that are just attributes
  if (Object.keys(parsedData).length === 1 && parsedData[":@"]) {
    return parsedData
  }

  if (parsedData.hasOwnProperty("#text")) {
    const text = parsedData["#text"]
    if (text === null || text === undefined || text === "") return undefined
    // Keep non-empty text, even if it's just whitespace (1C sometimes uses it)
    if (typeof text === "string" && text.trim().length === 0) return undefined
    return parsedData
  }

  const tagName = Object.keys(parsedData).find((k) => k !== ":@")
  if (!tagName) {
    return parsedData // Keep objects that are just attributes
  }

  // Always keep v8:content
  if (tagName === "v8:content") {
    return parsedData
  }

  // Remove ContextMenu and ExtendedTooltip elements that are empty
  if ((tagName === "ContextMenu" || tagName === "ExtendedTooltip") && isEmptyElement(parsedData[tagName])) {
    // return undefined
    console.log("removeEmptyNodes", tagName, parsedData)
  }

  const children = parsedData[tagName]
  const processedChildren = removeEmptyNodes(context, children)

  const hasNonNilAttrs = hasAttributesOtherThanNil(parsedData[":@"])

  if (
    !hasNonNilAttrs &&
    (processedChildren === undefined || (Array.isArray(processedChildren) && processedChildren.length === 0))
  ) {
    // If it's a known tag that should be kept even if empty, keep it
    // But for now, 1C clean XML usually removes them
    return []
  }

  return {
    ...parsedData,
    [tagName]: processedChildren !== undefined ? processedChildren : [],
  }
}

const isEmptyElement = (element: any): boolean => {
  if (element === null || element === undefined) return true
  if (typeof element !== "object") return false
  if (Array.isArray(element)) return element.length === 0

  // Check if object only has attributes and no content
  const keys = Object.keys(element)
  return keys.length === 0 || (keys.length === 1 && element[":@"])
}

const hasAttributesOtherThanNil = (attributes: any): boolean => {
  if (!attributes) return false
  const keys = Object.keys(attributes)
  if (keys.length === 0) return false

  let hasNilTrue = false
  for (const key of keys) {
    if (key.endsWith(":nil") || key === "nil") {
      if (attributes[key] === "true" || attributes[key] === true) {
        hasNilTrue = true
      }
    }
  }

  if (hasNilTrue && keys.length === 1) return false
  return true
}
