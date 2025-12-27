import { Context } from "~/metadata/context/types"
import { I8nText, I8nTextEnterprise } from "./types"

export const importI8nTextFromEnterprise = (
  context: Context,
  data: I8nTextEnterprise | undefined
): I8nText | undefined => {
  if (data === undefined) return undefined

  if (typeof data === "string") {
    return {
      items: {
        [context.defaultLanguage]: data,
      },
    }
  }

  return {
    items: data,
  }
}

export const parseI8nText = importI8nTextFromEnterprise
