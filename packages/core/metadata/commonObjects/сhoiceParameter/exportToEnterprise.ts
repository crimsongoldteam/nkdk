import { Context } from "../../context/types"
import { ChoiceParameterLinksEnterprise } from "../сhoiceParameterLinks/types"
import { ChoiceParameters } from "./types"

export const exportChoiceParameterLinksToEnterprise = (
  _context: Context,
  data: ChoiceParameters | undefined
): ChoiceParameterLinksEnterprise | undefined => {
  if (!data) return undefined

  return "todo"
}
