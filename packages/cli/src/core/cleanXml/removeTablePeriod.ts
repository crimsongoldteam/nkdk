import type { CleanContext } from "./types"

export const removeTablePeriod = (context: CleanContext, parsedData: any): any => {
  if (parsedData === null || parsedData === undefined) {
    return parsedData
  }

  if (Array.isArray(parsedData)) {
    return parsedData
      .map((item) => removeTablePeriod(context, item))
      .filter((item) => item !== undefined && item !== null)
  }

  if (typeof parsedData !== "object") {
    return parsedData
  }

  const tagName = Object.keys(parsedData).find((k) => k !== ":@")
  if (!tagName || tagName === "#text") {
    return parsedData
  }

  const children = parsedData[tagName]

  if (tagName === "Table" && Array.isArray(children)) {
    // Удаляем Period из детей Table
    const filteredChildren = children.filter((child) => {
      if (typeof child !== "object" || child === null) {
        return true
      }
      const childTagName = Object.keys(child).find((k) => k !== ":@")
      return childTagName !== "Period"
    })
    return {
      ...parsedData,
      [tagName]: removeTablePeriod(context, filteredChildren),
    }
  }

  return {
    ...parsedData,
    [tagName]: removeTablePeriod(context, children),
  }
}
