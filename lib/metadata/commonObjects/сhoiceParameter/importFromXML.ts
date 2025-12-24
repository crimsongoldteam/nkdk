import { Context } from "../../context/types"
import { ChoiceParameterLinks, ChoiceParameterLinksXML } from "./types"

export const importChoiceParameterFromXML = (
  _context: Context,
  xml: ChoiceParameterLinksXML | undefined
): ChoiceParameterLinks => {
  if (!xml) return undefined
}
