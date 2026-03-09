import { camelCase } from "change-case"
import { I8nText } from "~/metadata/commonObjects/i8nText/types"
import { ConfigurationContext } from "~/metadata/context/types"

export const formatElementName = (element: { name: string }) => {
  return element.name
}

export const formatElementNameWithDataPath = (params: {
  context: ConfigurationContext
  element: { name: string; dataPath?: string | undefined }
}) => {
  const { element } = params
  const dataPath = element.dataPath ?? ""

  const dataPathWithoutDots = dataPath.replace(/\./g, "")

  if (dataPathWithoutDots === element.name) {
    return element.name
  }

  const result = `${element.name}(${dataPath})`

  return result
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
  alwaysShowTitle: boolean = false,
  withDataPath: boolean = false
) => {
  let titleText = formatDefaultLanguageText(context, element.title!)
  if (alwaysShowTitle && !titleText) {
    titleText = '""'
  }

  const namePart = withDataPath ? formatElementNameWithDataPath({ context, element }) : formatElementName(element)

  if (!titleText) return namePart

  const result = `${titleText} ${namePart}`
  return result.trim()
}

export const toCamelCase = (str: string): string => {
  return camelCase(str)
}

export const wrapButtonContent = (content: string): string => {
  return "<" + content + ">"
}

/**
 * Всегда экранирует текст в кавычки.
 * Если в тексте есть двойные кавычки, но нет одинарных — оборачивает в одинарные кавычки.
 * Иначе — в двойные (двойные кавычки в тексте удваиваются).
 * Переносы строк, табуляция и т.д. заменяются на \n, \t и т.д.
 *
 * @param text - текст для экранирования
 * @returns экранированный текст в кавычках
 */
export const escapeText = (text: string | undefined): string | undefined => {
  if (!text) return undefined

  const hasDouble = text.includes('"')
  const hasSingle = text.includes("'")
  const useSingleQuotes = hasDouble && !hasSingle

  // Важно: сначала заменяем обратный слэш, чтобы не заэкранировать слэши в \n, \t и т.д.
  const escapeCommon = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/\t/g, "\\t").replace(/\r/g, "\\r")

  if (useSingleQuotes) {
    const escaped = escapeCommon(text).replace(/'/g, "\\'")
    return `'${escaped}'`
  }

  const escaped = escapeCommon(text).replace(/"/g, '""')
  return `"${escaped}"`
}
