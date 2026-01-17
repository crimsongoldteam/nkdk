import type { CleanContext } from "./types.js"

export const sortData = (
  context: CleanContext,
  parsedData: any,
  isInsideSortableTag: boolean,
  parentKey: string
): any => {
  if (parsedData == null || typeof parsedData !== "object") {
    return parsedData
  }

  if (Array.isArray(parsedData)) {
    const result = []

    for (const item of parsedData) {
      const resultValue = sortData(context, item, isInsideSortableTag, parentKey)
      result.push(resultValue)
    }

    return result
  }

  // Get all keys first
  const allKeys = Object.keys(parsedData)

  // Sort keys if we're inside a sortable tag
  const attributeKey = allKeys.find((k) => k === "@attributes")
  const otherKeys = allKeys.filter((k) => k !== "@attributes")
  const sortedOtherKeys = isInsideSortableTag ? otherKeys.sort((a, b) => a.localeCompare(b, "ru")) : otherKeys
  const keysToProcess = attributeKey ? [attributeKey, ...sortedOtherKeys] : sortedOtherKeys

  const result: Record<string, any> = {}
  for (const key of keysToProcess) {
    if (key == "@attributes") {
      result["@attributes"] = parsedData["@attributes"]
      continue
    }

    const isSortable = context.sortableTags.includes(key)
    const resultValue = sortData(context, parsedData[key], isSortable, key)
    result[key] = resultValue
  }

  return result
}
