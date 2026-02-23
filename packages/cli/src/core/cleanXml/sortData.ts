import type { CleanContext } from "./types"

export const sortData = (context: CleanContext, parsedData: any, isInsideSortableTag: boolean): any => {
  if (parsedData === null || parsedData === undefined) {
    return parsedData
  }

  if (Array.isArray(parsedData)) {
    const items = [...parsedData]
    if (isInsideSortableTag) {
      items.sort((a, b) => {
        const tagA = Object.keys(a).find((k) => k !== ":@") || ""
        const tagB = Object.keys(b).find((k) => k !== ":@") || ""
        return tagA.localeCompare(tagB, "en")
      })
    }
    return items.map((item) => sortData(context, item, false))
  }

  const tagName = Object.keys(parsedData).find((k) => k !== ":@")
  if (!tagName || tagName === "#text") return parsedData

  const isSortable = context.sortableTags.includes(tagName)

  const children = parsedData[tagName]
  return {
    ...parsedData,
    [tagName]: sortData(context, children, isSortable),
  }
}
