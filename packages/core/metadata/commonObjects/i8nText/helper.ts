import { ConfigurationContext } from "~/metadata/context/types"
import { FormattedI8nText } from "../formattedI8nText/types"
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

export const isEmptyFormattedI8nText = (context: ConfigurationContext, data: FormattedI8nText): boolean => {
  if (data.formatted) return false

  return isEmptyI8nText(context, undefined, data)
}
