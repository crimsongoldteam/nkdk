import { TTypeLink, TTypeLinkXML } from "./types"

export const importTypeLinkFromXML = (xml: TTypeLinkXML | undefined): TTypeLink | undefined => {
  if (!xml) return undefined

  const result: TTypeLink = {
    dataPath: xml["xr:DataPath"],
    linkItem: xml["xr:LinkItem"],
  }

  return result
}
