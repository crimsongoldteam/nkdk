import { TI8nText } from "./types"
import { TI8nTextEnterprise } from "./types"
import { TConfigurationSettings } from "~/lib/metadata/configurationSettings/types"

export const formatI8nText = (
  title: TI8nText | undefined,
  configurationSettings: TConfigurationSettings
): TI8nTextEnterprise | undefined => {
  if (!title) return undefined

  const defaultLanguage = configurationSettings.defaultLanguage

  const items = title.items

  if (Object.keys(items).length === 1 && items[defaultLanguage])
    return items[defaultLanguage]

  return items
}
