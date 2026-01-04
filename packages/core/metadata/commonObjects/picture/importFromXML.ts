import { Context } from "../../context/types"
import { Picture, PictureXML } from "./types"

export const importPictureFromXML = (_context: Context, xml: PictureXML | undefined): Picture | undefined => {
  if (!xml) return undefined

  const [type, ref] = xml["xr:Ref"].split(".")

  const result: Picture = {
    ref: ref,
    type: type === "StdPicture" ? "StandardPicture" : "CommonPicture",
    loadTransparent: xml["xr:LoadTransparent"],
  }

  return result
}
