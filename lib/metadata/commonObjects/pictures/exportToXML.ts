import { ConfigurationSettings } from "../../configurationSettings/types"
import { Picture, PictureXML } from "./types"

export const exportPictureToXML = (
  _configurationSettings: ConfigurationSettings,
  picture: Picture | undefined
): PictureXML | undefined => {
  if (!picture) return undefined

  const ref = picture.type === "StandardPicture" ? `StdPicture.${picture.ref}` : `CommonPicture.${picture.ref}`

  return {
    "xr:Ref": ref,
    "xr:LoadTransparent": picture.loadTransparent,
  }
}
