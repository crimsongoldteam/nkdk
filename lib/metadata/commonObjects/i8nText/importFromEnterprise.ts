import { Context } from "~/lib/metadata/context/types"
import { I8nText, I8nTextEnterprise } from "./types"

export const parseI8nText = (
  value: I8nTextEnterprise | undefined,
  configurationSettings: Context
): I8nText | undefined => {
  if (value === undefined) return undefined

  if (typeof value === "string") {
    return {
      items: {
        [configurationSettings.defaultLanguage]: value,
      },
    }
  }

  return {
    items: value,
  }
}
