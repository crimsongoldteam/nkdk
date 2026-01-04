import { Context } from "../../context/types"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { Picture, PictureXML } from "./types"

export const importPictureFromXML = (context: Context, xml: PictureXML | undefined): Picture | undefined => {
  if (!xml) return undefined

  const [type, ref] = xml["xr:Ref"].split(".")

  const result: Picture = {
    ref: ref,
    type: type === "StdPicture" ? "StandardPicture" : "CommonPicture",
    loadTransparent: importBooleanFromXML(context, xml["xr:LoadTransparent"])!,
  }

  return result
}
