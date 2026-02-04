import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataSimpleValueToXML } from "../metadataValue/exportToXML"
import { TypeLink, TypeLinkXML } from "./types"

export const exportTypeLinkToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  typeLink: TypeLink | undefined
): TypeLinkXML | undefined => {
  if (!typeLink) return undefined

  return {
    "xr:DataPath": typeLink.dataPath,
    "xr:LinkItem": Number(typeLink.linkItem),
  }
}

export const exportTypeLinkWithXSITypeToXML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  typeLink: TypeLink | undefined
): TypeLinkXML | undefined => {
  if (!typeLink) return undefined

  const dataPath = exportMetadataSimpleValueToXML(context, undefined, typeLink.dataPath, "string")!

  return {
    "xr:DataPath": dataPath,
    "xr:LinkItem": Number(typeLink.linkItem),
  }
}


registerTypeRule("TypeLink", "exportToXML", exportToXML)