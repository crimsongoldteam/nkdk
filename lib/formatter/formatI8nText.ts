import { TI8nText } from "~/lib/metadata/types"
import { TI8nTextEnterprise } from "./types"

export const formatI8nText = (
  title: TI8nText | undefined,
  defaultLang: string = "ru"
): TI8nTextEnterprise | undefined => {
  if (!title) return undefined

  if (Object.keys(title).length === 1 && title[defaultLang]) return title[defaultLang]

  return title
}
