import { Context } from "../../context/types"
import { TypeLink, TypeLinkXML } from "./types"

export const exportTypeLinkToXML = (_context: Context, typeLink: TypeLink | undefined): TypeLinkXML | undefined => {
  if (!typeLink) return undefined

  return {
    "xr:DataPath": typeLink.dataPath,
    "xr:LinkItem": typeof typeLink.linkItem === "string" ? parseInt(typeLink.linkItem) : typeLink.linkItem,
  }
}
