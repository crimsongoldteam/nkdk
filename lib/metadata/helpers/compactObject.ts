/**
 * Removes all properties with undefined value from an object
 * @param obj - object to clean
 * @returns new object without undefined properties
 */
export const compactObject = <T extends Record<string, any>>(obj: T): NonNullable<T> => {
  return Object.fromEntries(Object.entries(obj).filter(([_, value]) => value !== undefined)) as NonNullable<T>
}
