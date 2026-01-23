import type { CleanContext } from "./types.js"

const sortStringArray = (arr: any[]): any[] =>
  [...arr].sort((a, b) => String(a).localeCompare(String(b), "ru"))

export const sortChildObjects = (context: CleanContext, parsedData: any): any => {
  if (parsedData == null || typeof parsedData !== "object") {
    return parsedData
  }

  if (Array.isArray(parsedData)) {
    return parsedData.map((item) => sortChildObjects(context, item))
  }

  const result: Record<string, any> = {}

  for (const key of Object.keys(parsedData)) {
    const value = parsedData[key]

    if (key === "ChildObjects" && value != null && typeof value === "object") {
      const processed: Record<string, any> = {}
      for (const childType of Object.keys(value)) {
        const childValue = value[childType]
        const shouldSort = (childType === "Form" || childType === "Template") && Array.isArray(childValue)
        processed[childType] = shouldSort
          ? sortStringArray(childValue)
          : sortChildObjects(context, childValue)
      }
      result[key] = processed
      continue
    }

    result[key] = sortChildObjects(context, value)
  }

  return result
}
