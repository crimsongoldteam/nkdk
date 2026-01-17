import type { CleanContext } from "./types.js"

export const sortData = (context: CleanContext, parsedData: any, isInsideSortableTag: boolean = false): any => {
  if (parsedData == null || typeof parsedData !== "object") {
    return parsedData
  }

  if (Array.isArray(parsedData)) {
    const result = []

    for (const item of parsedData) {
      const resultValue = sortData(context, item, isInsideSortableTag)
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
    const resultValue = sortData(context, parsedData[key], isSortable)
    result[key] = resultValue
  }

  const sortedKeys = isInsideSortableTag ? Object.keys(result).sort((a, b) => a.localeCompare(b, "ru")) : result

  return sortedKeys
}
