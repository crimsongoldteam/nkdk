import { Context } from "../../context/types"
import { Picture, PictureXML } from "./types"

export const importPictureFromXML = (
  _configurationSettings: Context,
  xml: PictureXML | undefined
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
