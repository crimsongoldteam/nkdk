import { ConfigurationContext } from "../../context/types"
import { importBooleanFromXML } from "../boolean/importFromXML"
import { Picture, PictureXML } from "./types"

export const importPictureFromXML = (
  context: ConfigurationContext,
  xml: PictureXML | undefined
): Picture | undefined => {
  if (!xml) return undefined

  const loadTransparent = importBooleanFromXML(context, xml["xr:LoadTransparent"])!

  if (xml["xr:Abs"]) {
    return {
      ref: xml["xr:Abs"],
      type: "AbsolutePicture",
      loadTransparent,
    }
  }

  const [type, ref] = xml["xr:Ref"]!.split(".")
  return {
    ref,
    type: type === "StdPicture" ? "StandardPicture" : "CommonPicture",
    loadTransparent,
  }
}
