import { Context } from "~/lib/metadata/context/types"
import { I8nText, I8nTextEnterprise } from "./types"

export const exportI8nTextToEnterprise = (
  configurationSettings: Context,
  title: I8nText | undefined
): I8nTextEnterprise | undefined => {
  if (!title) return undefined

  const defaultLanguage = configurationSettings.defaultLanguage

  const items = title.items

  if (Object.keys(items).length === 1 && items[defaultLanguage]) return items[defaultLanguage]

  return items
}
