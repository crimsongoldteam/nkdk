import { ConfigurationContextFromXML } from "~/metadata/context/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { importBooleanFromXML } from "../boolean/fromXML"
import { isRawPictureRefValue, Picture, PictureXML } from "./types"

const importTransparentPixel = (
  transparentPixel: PictureXML["xr:TransparentPixel"] | undefined
): { x: number; y: number } | undefined => {
  if (!transparentPixel) return undefined

  return {
    x: Number.parseInt(String(transparentPixel._x)),
    y: Number.parseInt(String(transparentPixel._y)),
  }
}

export const importPictureFromXML = (
  context: ConfigurationContextFromXML,
  _rule: PropertyRule | undefined,
  xml: PictureXML | undefined
): Picture | undefined => {
  if (!xml) return undefined

  const xmlRef = xml["xr:Ref"]
  if (xmlRef && isRawPictureRefValue(xmlRef)) {
    return {
      rawRef: xmlRef,
      ...(xml["xr:LoadTransparent"] !== undefined
        ? { loadTransparent: importBooleanFromXML(context, undefined, xml["xr:LoadTransparent"]) }
        : {}),
      ...(xml["xr:TransparentPixel"] !== undefined
        ? { transparentPixel: importTransparentPixel(xml["xr:TransparentPixel"]) }
        : {}),
    }
  }

  const loadTransparent = importBooleanFromXML(context, undefined, xml["xr:LoadTransparent"])!

  const transparentPixel = importTransparentPixel(xml["xr:TransparentPixel"])

  if (xml["xr:Abs"]) {
    return {
      ref: xml["xr:Abs"],
      type: "AbsolutePicture",
      loadTransparent,
      ...(transparentPixel ? { transparentPixel } : {}),
    }
  }

  const [type, ref] = xmlRef!.split(".")
  return {
    ref,
    type: type === "StdPicture" ? "StandardPicture" : "CommonPicture",
    loadTransparent,
    ...(transparentPixel ? { transparentPixel } : {}),
  }
}

registerTypeRule("Picture", "importFromXML", importPictureFromXML)
