import type { CleanContext } from "./types"

export const sortEvents = (context: CleanContext, parsedData: any): any => {
  if (parsedData === null || parsedData === undefined) {
    return parsedData
  }

  if (Array.isArray(parsedData)) {
    return parsedData.map((item) => sortEvents(context, item)).filter((item) => item !== undefined)
  }

  if (typeof parsedData !== "object") {
    return parsedData
  }

  const tagName = Object.keys(parsedData).find((k) => k !== ":@")
  if (!tagName || tagName === "#text") {
    return parsedData
  }

  const children = parsedData[tagName]

  if (tagName === "Events" && Array.isArray(children)) {
    // Сортируем детей (элементы Event) по атрибуту name
    const sortedChildren = [...children].sort((a, b) => {
      const tagA = Object.keys(a).find((k) => k !== ":@")
      const tagB = Object.keys(b).find((k) => k !== ":@")

      if (tagA === "Event" && tagB === "Event") {
        const nameA = a[":@"]?.["@_name"] || ""
        const nameB = b[":@"]?.["@_name"] || ""
        return nameA.localeCompare(nameB, "ru")
      }
      return 0
    })

    return {
      ...parsedData,
      [tagName]: sortEvents(context, sortedChildren),
    }
  }

  return {
    ...parsedData,
    [tagName]: sortEvents(context, children),
  }
}
