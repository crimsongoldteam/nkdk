import { Context } from "~/metadata/context/types"
import { I8nText, I8nTextEnterprise } from "./types"

export const exportI8nTextToEnterprise = (
  context: Context,
  title: I8nText | undefined
): I8nTextEnterprise | undefined => {
  if (!title) return undefined

  const defaultLanguage = context.defaultLanguage

  const items = title.items

  if (Object.keys(items).length === 1 && items[defaultLanguage]) return items[defaultLanguage]

  return items
}
