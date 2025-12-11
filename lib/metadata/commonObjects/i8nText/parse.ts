import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { I8nText, I8nTextEnterprise } from "./types"

export const parseI8nText = (
  value: I8nTextEnterprise | undefined,
  configurationSettings: TConfigurationSettings
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
