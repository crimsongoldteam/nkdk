/**
 * Сортирует ключи объекта по алфавиту, оставляя указанные ключи в конце
 * @param obj - объект для сортировки
 * @param keysAtEnd - массив ключей, которые должны быть в конце (по умолчанию ["ChildItems"])
 * @returns новый объект с отсортированными ключами
 */
export function sortObjectKeys<T extends Record<string, any>>(obj: T, keysAtEnd: string[] = ["ChildItems"]): T {
  const allKeys = Object.keys(obj)
  const keysToSort = allKeys.filter((key) => !keysAtEnd.includes(key))
  const sortedKeys = keysToSort.sort()
  const endKeys = allKeys.filter((key) => keysAtEnd.includes(key))

  const sortedResult = {} as T
  for (const key of [...sortedKeys, ...endKeys]) {
    sortedResult[key as keyof T] = obj[key]
  }

  return sortedResult
}
