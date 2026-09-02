const collator = new Intl.Collator("ru")

const priority = (key: string): number => {
  if (key === "Заголовок" || key === "Синоним") return 0
  if (key === "Вид") return 1
  if (key === "Тип") return 2
  return 3
}

export const sortYamlRuleProperties = (value: Record<string, unknown>): Record<string, unknown> => {
  const originalKeys = Object.keys(value)
  const keys = [...originalKeys].sort(
    (left, right) => priority(left) - priority(right) || collator.compare(left, right)
  )
  if (keys.every((key, index) => key === originalKeys[index])) return value

  const descriptors = keys.map((key) => [key, Object.getOwnPropertyDescriptor(value, key)!] as const)
  for (const key of keys) {
    if (!Reflect.deleteProperty(value, key)) throw new Error(`Нельзя упорядочить YAML-свойство ${key}`)
  }
  for (const [key, descriptor] of descriptors) Object.defineProperty(value, key, descriptor)
  return value
}
