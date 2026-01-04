import { parse } from "yaml"

const convertNullToUndefined = <T>(value: T): T => {
  if (value === null) {
    return undefined as T
  }

  if (Array.isArray(value)) {
    return value.map(convertNullToUndefined) as T
  }

  if (typeof value === "object" && value !== null) {
    const result: any = {}
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        result[key] = convertNullToUndefined(value[key])
      }
    }
    return result as T
  }

  return value
}

export const importFromYAML = <T>(data: string): T => {
  const parsed = parse(data) as T
  return convertNullToUndefined(parsed)
}
