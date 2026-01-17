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
      const resultValue = sortData(context, item, false, parentKey)
      result.push(resultValue)
    }

    return result
  }

  const result: Record<string, any> = {}
  for (const key in parsedData) {
    if (key == "@attributes") {
      result["@attributes"] = parsedData["@attributes"]
      continue
    }

    const isSortable = context.sortableTags.includes(key)
    const resultValue = sortData(context, parsedData[key], isSortable, key)
    result[key] = resultValue
  }

  if (isInsideSortableTag) {
    const allKeys = Object.keys(result)
    const attributeKey = allKeys.find((k) => k === "@attributes")
    const otherKeys = allKeys.filter((k) => k !== "@attributes").sort((a, b) => a.localeCompare(b, "ru"))
    const sortedKeys = attributeKey ? [attributeKey, ...otherKeys] : otherKeys

    const sortedResult: Record<string, any> = {}
    for (const key of sortedKeys) {
      sortedResult[key] = result[key]
    }
    return result
  }

  return result
}
