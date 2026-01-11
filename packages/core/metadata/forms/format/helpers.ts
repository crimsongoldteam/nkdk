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
  return text.items[defaultLanguage]
}

export const formatElementTitleAndName = (
  context: ConfigurationContext,
  element: { title?: I8nText; name: string }
) => {
  const titleText = formatDefaultLanguageText(context, element.title!)

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
