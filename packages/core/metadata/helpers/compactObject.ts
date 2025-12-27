/**
 * Removes all properties with undefined value from an object and sorts the keys alphabetically
 * @param obj - object to clean
 * @returns new object without undefined properties
 */
export const compactObject = <T extends Record<string, any>>(obj: T): T => {
  let result: Record<string, any> = {}
  for (const key of Object.keys(obj)) {
    if (obj[key] === undefined) continue

    result[key] = obj[key]
  }

  return result as T
}

export const removeDefaults = <T extends Record<string, any>>(obj: T, defaults?: Partial<T>): T => {
  let result: Record<string, any> = {}
  for (const key of Object.keys(obj)) {
    if (defaults?.[key] === obj[key]) continue

    result[key] = obj[key]
  }
  return result as T
}
