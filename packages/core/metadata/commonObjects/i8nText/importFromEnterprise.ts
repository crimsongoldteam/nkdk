import { Context } from "~/metadata/context/types"
import { I8nText, I8nTextEnterprise } from "./types"

export const parseI8nText = (value: I8nTextEnterprise | undefined, context: Context): I8nText | undefined => {
  if (value === undefined) return undefined

  if (typeof value === "string") {
    return {
      items: {
        [context.defaultLanguage]: value,
      },
    }
  }

  return {
    items: value,
  }
}
