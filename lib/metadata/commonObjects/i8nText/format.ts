import { TI8nText } from "./types"
import { TI8nTextEnterprise } from "./types"

export const formatI8nText = (
  title: TI8nText | undefined
): TI8nTextEnterprise | undefined => {
  const defaultLang = "ru"

  if (!title) return undefined

  const items = title.items

  if (Object.keys(items).length === 1 && items[defaultLang])
    return items[defaultLang]

  return items
}
