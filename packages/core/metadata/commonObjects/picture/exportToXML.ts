import { ConfigurationContext } from "../../context/types"
import { Picture, PictureXML } from "./types"

export const exportPictureToXML = (
  _context: ConfigurationContext,
  picture: Picture | undefined
): PictureXML | undefined => {
  if (!picture) return undefined

  const ref = picture.type === "StandardPicture" ? `StdPicture.${picture.ref}` : `CommonPicture.${picture.ref}`

  return {
    "xr:Ref": ref,
    "xr:LoadTransparent": picture.loadTransparent,
  }
}
