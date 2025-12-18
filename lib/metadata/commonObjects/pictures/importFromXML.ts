import { ConfigurationSettings } from "../../configurationSettings/types"
import { Picture, PictureXML } from "./types"

export const importPictureFromXML = (
  xml: PictureXML | undefined,
  _configurationSettings: ConfigurationSettings
): Picture | undefined => {
  if (!xml) return undefined

  // Parse Ref to extract type and reference
  const [type, ref] = xml["xr:Ref"].split(".")

  const result: Picture = {
    ref: ref || xml["xr:Ref"],
    type: type === "StdPicture" ? "StandardPicture" : "CommonPicture",
    loadTransparent: xml["xr:LoadTransparent"],
  }

  return result
}
