import { MetadataFieldsRules } from "./types"

export const swapMetadataFieldsRulesKeys = (rules: MetadataFieldsRules): MetadataFieldsRules => {
  const result: MetadataFieldsRules = {}

  for (const [key, value] of Object.entries(rules)) {
    if (typeof value === "string") {
      result[value] = key
      continue
    }

    const fields = swapMetadataFieldsRulesKeys(value.fields)
    result[value.name] = { name: key, fields }
  }

  return result
}

export const convertPath = (rules: MetadataFieldsRules, path: string): string => {
  const parts = path.split(".")
  const result: string[] = []
  let currentRules: MetadataFieldsRules | undefined = rules
  let i = 0

  while (i < parts.length) {
    const part = parts[i]

    if (currentRules && part in currentRules) {
      const rule = currentRules[part]

      if (typeof rule === "string") {
        // Простая замена строкой
        result.push(rule)
        // После строки больше нет вложенных правил
        currentRules = undefined
        i++
        // Пропускаем следующую часть пути (имя конкретного поля)
        if (i < parts.length) {
          i++
        }
        continue
      } else {
        // Объект с name и fields
        result.push(rule.name)
        currentRules = rule.fields as MetadataFieldsRules
        i++
        continue
      }
    }

    // Часть не найдена в rules - это имя конкретного объекта/поля, оставляем как есть
    result.push(part)
    i++
  }

  return result.join(".")
}
