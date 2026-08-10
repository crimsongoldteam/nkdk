import { markYAMLScalarTag, yamlScalarTagAt } from "@nkdk/runtime"

const collator = new Intl.Collator("ru")

const priority = (key: string): number => {
  if (key === "Заголовок" || key === "Синоним") return 0
  if (key === "Вид") return 1
  if (key === "Тип") return 2
  return 3
}

export const sortYamlRuleProperties = (value: Record<string, unknown>): Record<string, unknown> => {
  const keys = Object.keys(value).sort(
    (left, right) => priority(left) - priority(right) || collator.compare(left, right)
  )
  const result: Record<string, unknown> = {}

  for (const key of keys) {
    if (key === "__proto__") {
      Object.defineProperty(result, key, {
        value: value[key],
        enumerable: true,
        configurable: true,
        writable: true,
      })
    } else {
      result[key] = value[key]
    }
    const scalarTag = yamlScalarTagAt(value, key)
    if (scalarTag !== undefined) markYAMLScalarTag(result, key, scalarTag)
  }

  return result
}
