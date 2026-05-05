import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importBooleanFromXML } from "../boolean/fromXML"
import { Picture, PictureXML } from "./types"
import { ConfigurationContextFromXML } from "~/metadata/context/types"

export const importPictureFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: PictureXML | undefined
): Picture | undefined => {
  if (!xml) return undefined

  const loadTransparent = importBooleanFromXML(context, undefined, xml["xr:LoadTransparent"])!

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

registerTypeRule("Picture", "importFromXML", importPictureFromXML)
