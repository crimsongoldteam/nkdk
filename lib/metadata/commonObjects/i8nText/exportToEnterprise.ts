import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { I8nText, I8nTextEnterprise } from "./types"

export const exportI8nTextToEnterprise = (
  configurationSettings: ConfigurationSettings,
  title: I8nText | undefined
): I8nTextEnterprise | undefined => {
  if (!title) return undefined

  const defaultLanguage = configurationSettings.defaultLanguage

  const items = title.items

  if (Object.keys(items).length === 1 && items[defaultLanguage]) return items[defaultLanguage]

  return items
}
