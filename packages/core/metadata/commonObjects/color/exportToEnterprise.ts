import { Context } from "../../context/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Color } from "./types"

export const exportColorToEnterprise = (_context: Context, color: Color | undefined): string | undefined => {
  if (!color) return undefined

  return exportSystemEnumerationToEnterprise(_context, color, SE.ColorTypeToEnterprise)
}
