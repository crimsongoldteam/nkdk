import { camelCase } from "change-case"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { ConfigurationContext } from "~/metadata/context/types"

export const formatElementName = (element: { name: string }) => {
  // return ""
  return "{" + element.name + "}"
}

export const formatDefaultLanguageText = (
  context: ConfigurationContext,
  text: I8nText | undefined
): string | undefined => {
  if (!text) return undefined

  const defaultLanguage = context.defaultLanguage
  return escapeWithDoubleQuotes(text.items[defaultLanguage])
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
 *
 * Специальные символы из лексера: ', %, #, ;, |, <, >, {, }, [, ], (, ), ,, :, ~, =, +, /, &, ?, _, -
 *
 * @param text - текст для экранирования
 * @returns экранированный текст в двойных кавычках или исходный текст
 */
export const escapeWithDoubleQuotes = (text: string | undefined): string | undefined => {
  if (!text) return undefined

  // Специальные символы из лексера, которые требуют экранирования
  const specialChars = /['%#;"|<>{}[\]():~=+\/&?_\-]/

  // Проверяем, содержит ли текст специальные символы или двойные кавычки
  const needsEscaping = specialChars.test(text) || text.includes('"')

  if (!needsEscaping) {
    return text
  }

  // Удваиваем двойные кавычки
  const escapedText = text.replace(/"/g, '""')

  // Оборачиваем в двойные кавычки
  return `"${escapedText}"`
}
