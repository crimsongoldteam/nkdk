const collator = new Intl.Collator("ru")

const priority = (key: string): number => {
  if (key === "Заголовок" || key === "Синоним") return 0
  if (key === "Вид") return 1
  if (key === "Тип") return 2
  return 3
}

export const sortYamlRuleProperties = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(value).sort(
      ([left], [right]) => priority(left) - priority(right) || collator.compare(left, right)
    )
  )
