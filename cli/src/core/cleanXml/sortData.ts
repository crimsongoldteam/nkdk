import type { CleanContext } from "./types.js"

export const sortData = (context: CleanContext, parsedData: any, isInsideSortableTag: boolean = false): any => {
  if (parsedData == null || typeof parsedData !== "object") {
    return parsedData
  }

  if (Array.isArray(parsedData)) {
    return parsedData.map((item) => sortData(context, item, false))
  }

  const result: Record<string, any> = {}
  const keys = isInsideSortableTag
    ? Object.keys(parsedData).sort((a, b) => a.localeCompare(b, "ru"))
    : Object.keys(parsedData)

  for (const key of keys) {
    const isCurrentKeySortable = context.sortableTags.includes(key)
    const nextIsInsideSortableTag = isInsideSortableTag ? false : isCurrentKeySortable
    result[key] = sortData(context, parsedData[key], nextIsInsideSortableTag)
  }

  return result
}
