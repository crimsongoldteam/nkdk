import { MetadataFieldsRules } from "./types"

export const swapMetadataFieldsRulesKeys = (
  rules: MetadataFieldsRules | undefined
): MetadataFieldsRules | undefined => {
  if (!rules) return undefined
  const result: MetadataFieldsRules = {}

  for (const [key, value] of Object.entries(rules)) {
    if (typeof value === "string") {
      result[value] = key
      continue
    }

    const fields = swapMetadataFieldsRulesKeys(value.fields)
    result[value.name] = { name: key, ...(fields ? { fields } : {}) }
  }

  return result
}

export const createMetadataTypesRules = (rules: MetadataFieldsRules): MetadataFieldsRules => {
  const result: MetadataFieldsRules = {}

  for (const [key, rule] of Object.entries(rules)) {
    if (typeof rule === "string") continue
    if (rule.includeToType === undefined) continue

    if (rule.includeToType === "Save") {
      result[key] = rule.name
      continue
    }

    result[`${key}Ref`] = rule.name

    if (rule.includeToType !== "Both") continue

    result[`${key}Object`] = `${rule.name}Объект`
  }

  return result
}

export const createMetadataValuesRules = (rules: MetadataFieldsRules): MetadataFieldsRules => {
  const result: MetadataFieldsRules = {}

  for (const [key, rule] of Object.entries(rules)) {
    if (typeof rule === "string") continue
    if (rule.includeToType !== "Both" && rule.includeToType !== "Ref") continue

    result[key] = {
      name: rule.name,
      fields: {
        EmptyRef: "ПустаяСсылка",
      },
    }
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
        result.push(rule)
        currentRules = undefined
        i++
        continue
      }

      result.push(rule.name)
      currentRules = rule.fields as MetadataFieldsRules
      i++
      continue
    }

    result.push(part)
    i++
  }

  return result.join(".")
}
