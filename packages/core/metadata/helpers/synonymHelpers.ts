import { I8nText, I8nTextYAML } from "../commonObjects/i8nText/types"
import { ConfigurationContext } from "../context/types"
import { canConvertToPascalCase, splitPascalCase } from "./canConvertToPascalCase"

export const excludeNameFromI8nText = (
  context: ConfigurationContext,
  synonym: I8nText,
  name: string
): I8nText | undefined => {
  const defaultLanguage = context.defaultLanguage
  const defaultLanguageValue = synonym.items[defaultLanguage]
  if (defaultLanguageValue === undefined || !canConvertToPascalCase(defaultLanguageValue, name)) return synonym

  const languages = Object.keys(synonym.items)
  if (languages.length === 1) return undefined

  const differentItems: Record<string, string> = {}
  for (const language of languages) {
    if (language !== defaultLanguage) differentItems[language] = synonym.items[language]
  }

  return { items: differentItems }
}

export const addDefaultLanguageNameToSynonym = (
  context: ConfigurationContext,
  synonym: I8nText | undefined,
  name: string
): I8nText => {
  const defaultLanguage = context.defaultLanguage
  const defaultName = splitPascalCase(name)

  // Если синоним не существует, создаем новый с языком по умолчанию
  if (!synonym) {
    return {
      items: {
        [defaultLanguage]: defaultName,
      },
    }
  }

  // Если язык по умолчанию уже существует, не заменяем его
  if (synonym.items[defaultLanguage] !== undefined) {
    return synonym
  }

  // Добавляем язык по умолчанию к существующему синониму
  return {
    ...synonym,
    items: {
      [defaultLanguage]: defaultName,
      ...synonym.items,
    },
  }
}

export const isSynonymEqualToName = (synonym: I8nTextYAML | undefined, name: string): boolean => {
  if (!synonym) return false

  // Если синоним - строка, проверяем её
  if (typeof synonym === "string") {
    return canConvertToPascalCase(synonym, name)
  }

  // Если синоним - объект, проверяем все значения
  for (const value of Object.values(synonym)) {
    if (!canConvertToPascalCase(value, name)) {
      return false
    }
  }

  return true
}
