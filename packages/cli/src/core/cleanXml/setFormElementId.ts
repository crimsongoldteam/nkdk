import type { CleanContext } from "./types"

export const setFormElementId = (context: CleanContext, parsedData: any): any => {
  return process(parsedData, { id: 1 })
}

const process = (data: any, params: { id: number }): any => {
  if (data === null || data === undefined) {
    return data
  }

  if (Array.isArray(data)) {
    return data.map((item) => process(item, params)).filter((item) => item !== undefined)
  }

  if (typeof data !== "object") {
    return data
  }

  const attributes = data[":@"]

  if (attributes !== undefined && typeof attributes === "object") {
    for (const [key, value] of Object.entries(attributes)) {
      if (key !== "@_id") continue
      if (value === "-1") continue
      attributes[key] = String(params.id)
      params.id++
    }
  }

  const tagName = Object.keys(data).find((k) => k !== ":@")
  if (!tagName || tagName === "#text") {
    return data
  }

  const children = data[tagName]
  const processedChildren = process(children, params)

  return {
    ...data,
    [tagName]: processedChildren,
  }
}
