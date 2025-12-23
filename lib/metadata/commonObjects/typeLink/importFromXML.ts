import { ConfigurationSettings } from "../../configurationSettings/types"
import { TypeLink, TypeLinkXML } from "./types"

export const importTypeLinkFromXML = (
  _configurationSettings: ConfigurationSettings,
  xml: TypeLinkXML | undefined
): TypeLink | undefined => {
  if (!xml) return undefined

  const result: TypeLink = {
    dataPath: xml["xr:DataPath"],
    linkItem: xml["xr:LinkItem"],
  }

  return result
}
