import { ConfigurationContext } from "../../context/types"
import { importOldBooleanFromXML } from "../boolean/_importFromXML"
import { Picture, PictureXML } from "./types"

export const importPictureFromXML = (
  context: ConfigurationContext,
  xml: PictureXML | undefined
): Picture | undefined => {
  if (!xml) return undefined

  const loadTransparent = importOldBooleanFromXML(context, xml["xr:LoadTransparent"])!

  const transparentPixel = xml["xr:TransparentPixel"]
    ? {
        x: Number.parseInt(String(xml["xr:TransparentPixel"]._x)),
        y: Number.parseInt(String(xml["xr:TransparentPixel"]._y)),
      }
    : undefined

  if (xml["xr:Abs"]) {
    return {
      ref: xml["xr:Abs"],
      type: "AbsolutePicture",
      loadTransparent,
      transparentPixel,
    }
  }

  const [type, ref] = xml["xr:Ref"]!.split(".")
  return {
    ref,
    type: type === "StdPicture" ? "StandardPicture" : "CommonPicture",
    loadTransparent,
    transparentPixel,
  }
}
