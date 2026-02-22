import { ConfigurationContext } from "~/metadata/context/types"
import { I8nText } from "./types"

export const isEmptyI8nText = (context: ConfigurationContext, data: I8nText): boolean => {
  for (const [lang, content] of Object.entries(data.items)) {
    if (lang === context.defaultLanguage && content !== "") {
      return false
    }

    if (lang !== context.defaultLanguage) {
      return false
    }
  }

  return true
}

export function importI8nTextFromString(params: {
  context: ConfigurationContext
  value: undefined
  trim?: boolean
}): undefined
export function importI8nTextFromString(params: {
  context: ConfigurationContext
  value: string
  trim?: boolean
}): I8nText
export function importI8nTextFromString(params: {
  context: ConfigurationContext
  value: string | undefined
  trim?: boolean
}): I8nText | undefined
export function importI8nTextFromString(params: {
  context: ConfigurationContext
  value: string | undefined
  trim?: boolean
}): I8nText | undefined {
  const { context, value, trim } = params
  if (value === undefined) return undefined
  return {
    items: {
      [context.defaultLanguage]: trim ? value.trim() : value,
    },
  }
}
