/** Меняет только порядок собственных ключей, сохраняя объект и дескрипторы. */
export function arrangeProperties(
  value: Record<string, unknown>,
  originalKeys: readonly string[],
  keys: readonly string[],
): Record<string, unknown> {
  if (keys.every((key, index) => key === originalKeys[index])) return value
  const descriptors = keys.map((key) => [key, Object.getOwnPropertyDescriptor(value, key)!] as const)
  for (const key of keys) {
    if (!Reflect.deleteProperty(value, key)) throw new Error(`Нельзя упорядочить свойство ${key}`)
  }
  for (const [key, descriptor] of descriptors) Object.defineProperty(value, key, descriptor)
  return value
}
