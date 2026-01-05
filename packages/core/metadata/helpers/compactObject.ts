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

export const sortObject = <T extends Record<string, any>>(obj: T): T => {
  const keys = Object.keys(obj)
  const regularKeys = keys.filter((key) => !key.startsWith("_")).sort()
  const underscoreKeys = keys.filter((key) => key.startsWith("_"))
  const sortedKeys = [...regularKeys, ...underscoreKeys]
  const result: Record<string, any> = {}
  for (const key of sortedKeys) {
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

/**
 * Merges objects, ignoring undefined values from the source object
 * @param target - target object (defaults)
 * @param source - source object (data)
 * @returns merged object where undefined values from source don't override target values
 */
export const mergeIgnoringUndefined = <T extends Record<string, any>>(source: T, target: Partial<T>): T => {
  const result: Record<string, any> = { ...target }
  for (const key of Object.keys(source)) {
    if (source[key] !== undefined) {
      result[key] = source[key]
    }
  }
  return result as T
}
