import { I8nText, I8nTextEnterprise } from "../commonObjects/i8nText/types"
import { ConfigurationContext } from "../context/types"
import { canConvertToPascalCase, splitPascalCase } from "./canConvertToPascalCase"

export const extractDifferentSynonymPart = (
  context: ConfigurationContext,
  synonym: I8nText,
  name: string
): I8nText | undefined => {
  const differentItems: Record<string, string> = {}
  const defaultLanguage = context.defaultLanguage

  // Проверяем каждое значение в items
  for (const [lang, value] of Object.entries(synonym.items)) {
    // Исключаем только язык по умолчанию, если он равен имени
    // Остальные языки оставляем, даже если они тоже равны имени
    if (lang === defaultLanguage && canConvertToPascalCase(value, name)) {
      continue
    }
    differentItems[lang] = value
  }

  // Если все языки равны имени, возвращаем undefined
  if (Object.keys(differentItems).length === 0) {
    return undefined
  }

  // Возвращаем новый I8nText с оставшимися языками
  return {
    items: differentItems,
  }
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

export const isSynonymEqualToName = (synonym: I8nTextEnterprise | undefined, name: string): boolean => {
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
