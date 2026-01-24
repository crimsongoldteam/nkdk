import type { CleanContext } from "./types.js"

export const removeTablePeriod = (context: CleanContext, parsedData: any): any => {
  if (parsedData === null || parsedData === undefined) {
    return parsedData
  }

  if (typeof parsedData !== "object") {
    return parsedData
  }

  if (Array.isArray(parsedData)) {
    return parsedData.map((item) => removeTablePeriod(context, item))
  }

  const result: Record<string, any> = {}

  for (const key of Object.keys(parsedData)) {
    const value = parsedData[key]

    if (key === "Table") {
      if (Array.isArray(value)) {
        result[key] = value.map((table) => {
          if (typeof table === "object" && table !== null) {
            const { Period, ...rest } = table
            return removeTablePeriod(context, rest)
          }
          return table
        })
      } else if (typeof value === "object" && value !== null) {
        const { Period, ...rest } = value
        result[key] = removeTablePeriod(context, rest)
      } else {
        result[key] = value
      }
    } else {
      result[key] = removeTablePeriod(context, value)
    }
  }

  return result
}
