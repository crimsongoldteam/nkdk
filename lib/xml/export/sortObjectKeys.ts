/**
 * Сортирует ключи объекта по заданному порядку из массива
 * @param obj - объект для сортировки
 * @param order - массив ключей в нужном порядке
 * @returns новый объект с отсортированными ключами
 */
export function sortObjectByKeys<T extends Record<string, any>>(obj: T, order: string[]): T {
  if (order.length === 0) return obj

  const allKeys = Object.keys(obj)
  const orderMap = new Map<string, number>()

  // Создаем карту индексов для ключей из массива order
  order.forEach((key, index) => {
    orderMap.set(key, index)
  })

  // Разделяем ключи на те, что есть в order, и те, что отсутствуют
  const orderedKeys = allKeys.filter((key) => orderMap.has(key))
  const unorderedKeys = allKeys.filter((key) => !orderMap.has(key))

  // Сортируем ключи по их позиции в массиве order
  orderedKeys.sort((a, b) => {
    const indexA = orderMap.get(a) ?? Infinity
    const indexB = orderMap.get(b) ?? Infinity
    return indexA - indexB
  })

  // Сортируем оставшиеся ключи по алфавиту
  unorderedKeys.sort()

  // Создаем новый объект с правильным порядком ключей
  const sortedResult = {} as T
  for (const key of [...orderedKeys, ...unorderedKeys]) {
    sortedResult[key as keyof T] = obj[key]
  }

  return sortedResult
}
