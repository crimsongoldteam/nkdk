import { Context } from "../../context/types"
import { exportMetadataSimpleValueToXML } from "../metadataValue/exportToXML"
import { TypeLink, TypeLinkXML } from "./types"

export const exportTypeLinkToXML = (_context: Context, typeLink: TypeLink | undefined): TypeLinkXML | undefined => {
  if (!typeLink) return undefined

  return {
    "xr:DataPath": typeLink.dataPath,
    "xr:LinkItem": Number(typeLink.linkItem),
  }
}

export const exportTypeLinkWithXSITypeToXML = (
  context: Context,
  typeLink: TypeLink | undefined
): TypeLinkXML | undefined => {
  if (!typeLink) return undefined

  const dataPath = exportMetadataSimpleValueToXML(context, typeLink.dataPath, "string")!

  return {
    "xr:DataPath": dataPath,
    "xr:LinkItem": Number(typeLink.linkItem),
  }
}
