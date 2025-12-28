import { Context } from "../../context/types"
import { exportMetadataSimpleValueToXML } from "../metadataValue/exportToXML"
import { ChoiceParameterLink, ChoiceParameterLinks, ChoiceParameterLinksXML, ChoiceParameterLinkXML } from "./types"

export const exportChoiceParameterLinkToXML = (context: Context, link: ChoiceParameterLink): ChoiceParameterLinkXML => {
  const dataPath = exportMetadataSimpleValueToXML(context, link.dataPath, "string")!

  return {
    "xr:DataPath": dataPath,
    "xr:Name": link.name,
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
