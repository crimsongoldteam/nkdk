import { Context } from "../../context/types"
import { Font, FontEnterprise } from "./types"

export const exportFontToEnterprise = (_context: Context, font: Font | undefined): FontEnterprise | undefined => {
  if (!font) return undefined

  return "TODO"
}
