export const sortObjectByKeys = <T extends Record<string, any>>(obj: T, order: string[]): T => {
  if (order.length === 0) return obj

  const allKeys = Object.keys(obj)
  const orderMap = new Map<string, number>()

  order.forEach((key, index) => {
    orderMap.set(key, index)
  })

  const orderedKeys = allKeys.filter((key) => orderMap.has(key))
  const unorderedKeys = allKeys.filter((key) => !orderMap.has(key))

  orderedKeys.sort((a, b) => {
    const indexA = orderMap.get(a) ?? Infinity
    const indexB = orderMap.get(b) ?? Infinity
    return indexA - indexB
  })

  unorderedKeys.sort()

  const sortedResult = {} as T
  for (const key of [...orderedKeys, ...unorderedKeys]) {
    sortedResult[key as keyof T] = obj[key]
  }

  return sortedResult
}
