import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { TI8nText, TI8nTextEnterprise } from "./types"

export const parseI8nText = (
  value: TI8nTextEnterprise | undefined,
  configurationSettings: TConfigurationSettings
): TI8nText | undefined => {
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
