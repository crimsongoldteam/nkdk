import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataSimpleValueToXML } from "../metadataValue/exportToXML"
import { ChoiceParameterLink, ChoiceParameterLinks, ChoiceParameterLinksXML, ChoiceParameterLinkXML } from "./types"

export const exportChoiceParameterLinkToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  link: ChoiceParameterLink
): ChoiceParameterLinkXML => {
  const dataPath = exportMetadataSimpleValueToXML(context, undefined, link.dataPath, "string")!

  return {
    "xr:Name": link.name,
    "xr:DataPath": dataPath,
    "xr:ValueChange": link.valueChange,
  }
}

export const exportChoiceParameterLinksToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  links: ChoiceParameterLinks | undefined
): ChoiceParameterLinksXML | undefined => {
  if (!links || links.length === 0) return undefined

  return {
    "xr:Link": links.map((link) => exportChoiceParameterLinkToXML(context, undefined, link)),
  }
}
