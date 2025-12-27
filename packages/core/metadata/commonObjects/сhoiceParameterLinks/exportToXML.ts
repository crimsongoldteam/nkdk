import { Context } from "../../context/types"
import { ChoiceParameterLink, ChoiceParameterLinks, ChoiceParameterLinksXML, ChoiceParameterLinkXML } from "./types"

export const exportChoiceParameterLinkToXML = (
  _context: Context,
  link: ChoiceParameterLink
): ChoiceParameterLinkXML => {
  return {
    "xr:Name": link.name,
    "xr:DataPath": link.dataPath,
    "xr:ValueChange": link.valueChange,
  }
}

export const exportChoiceParameterLinksToXML = (
  context: Context,
  links: ChoiceParameterLinks | undefined
): ChoiceParameterLinksXML | undefined => {
  if (!links || links.length === 0) return undefined

  return {
    "xr:Link": links.map((link) => exportChoiceParameterLinkToXML(context, link)),
  }
}
