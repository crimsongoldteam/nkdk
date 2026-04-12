import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { exportMetadataValueToXML } from "../metadataValue/toXML"
import { MetadataPrimitiveValueXML } from "../metadataValue/types"
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

  const dataPath = exportMetadataValueToXML({
    context,
    rule: { type: "MetadataValue", valueType: "string" },
    value: typeLink.dataPath,
  })! as MetadataPrimitiveValueXML

  return {
    "xr:DataPath": dataPath,
    "xr:LinkItem": Number(typeLink.linkItem),
  }
}

registerTypeRule("TypeLink", "exportToXML", exportTypeLinkToXML)
