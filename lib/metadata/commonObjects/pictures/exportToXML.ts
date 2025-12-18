import { ConfigurationSettings } from "../../configurationSettings/types"
import { Picture, PictureXML } from "./types"

export const exportPictureToXML = (
  picture: Picture | undefined,
  _configurationSettings: ConfigurationSettings
): PictureXML | undefined => {
  if (!picture) return undefined

  const ref = picture.type === "StandardPicture" ? `StdPicture.${picture.ref}` : `CommonPicture.${picture.ref}`

  return {
    "xr:Ref": ref,
    "xr:LoadTransparent": picture.loadTransparent,
  }
}
