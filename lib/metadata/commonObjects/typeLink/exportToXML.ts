import { TTypeLink, TTypeLinkXML } from "./types"

export const exportTypeLinkToXML = (typeLink: TTypeLink | undefined): TTypeLinkXML | undefined => {
  if (!typeLink) return undefined

  return {
    "xr:DataPath": typeLink.dataPath,
    "xr:LinkItem": typeof typeLink.linkItem === "string" ? parseInt(typeLink.linkItem) : typeLink.linkItem,
  }
}
