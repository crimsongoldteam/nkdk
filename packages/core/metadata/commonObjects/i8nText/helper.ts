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
