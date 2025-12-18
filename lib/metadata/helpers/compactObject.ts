/**
 * Removes all properties with undefined value from an object and sorts the keys alphabetically
 * @param obj - object to clean
 * @returns new object without undefined properties
 */
export const compactObject = <T extends Record<string, any>>(obj: T): T => {
  return Object.fromEntries(
    Object.entries(obj)
      .filter(([_, value]) => value !== undefined)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
  ) as T
}
