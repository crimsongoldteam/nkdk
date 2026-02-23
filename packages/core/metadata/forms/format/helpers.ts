import { camelCase } from "change-case"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { ConfigurationContext } from "~/metadata/context/types"

export const formatElementName = (element: { name: string }) => {
  // return ""
  return "%" + element.name
}

export const formatDefaultLanguageText = (
  context: ConfigurationContext,
  text: I8nText | undefined
): string | undefined => {
  if (!text) return undefined

  const defaultLanguage = context.defaultLanguage
  return escapeText(text.items[defaultLanguage])
}

export const formatElementTitleAndName = (
  context: ConfigurationContext,
  element: { title?: I8nText; name: string },
  alwaysShowTitle: boolean = false
) => {
  let titleText = formatDefaultLanguageText(context, element.title!)
  if (alwaysShowTitle && !titleText) {
    titleText = '""'
  }

  if (!titleText) return formatElementName(element)

  const result = `${titleText} ${formatElementName(element)}`
  return result.trim()
}

export const toCamelCase = (str: string): string => {
  return camelCase(str)
}

export const wrapButtonContent = (content: string): string => {
  return "<" + content + ">"
}

/**
 * Экранирует текст в двойные кавычки, если он содержит специальные символы.
 * Если текст содержит двойные кавычки, они удваиваются.
 * Переносы строк, табуляция и другие специальные символы заменяются на \n, \t и т.д.
 *
 * Специальные символы из лексера: ', %, #, ;, |, <, >, {, }, [, ], (, ), ,, :, ~, =, +, /, &, ?, _, -
 *
 * @param text - текст для экранирования
 * @returns экранированный текст в двойных кавычках или исходный текст
 */
export const escapeText = (text: string | undefined): string | undefined => {
  if (!text) return undefined

  // Специальные символы из лексера, которые требуют экранирования
  // Добавляем переносы строк, табуляцию, возврат каретки и обратный слэш
  const specialChars = /['%#;"|<>{}[\]():~=+\/&?_\-\n\t\r\\]/

  // Проверяем, содержит ли текст специальные символы или двойные кавычки
  const needsEscaping = specialChars.test(text) || text.includes('"')

  if (!needsEscaping) {
    return text
  }

  // Заменяем специальные символы на их escape-последовательности
  // Важно: сначала заменяем обратный слэш, чтобы не заэкранировать слэши в \n, \t и т.д.
  const escapedText = text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/\r/g, "\\r")
    .replace(/"/g, '""')

  // Оборачиваем в двойные кавычки
  return `"${escapedText}"`
}
