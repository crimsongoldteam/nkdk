import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { ConfigurationContext } from "../../context/types"
import { isRawPictureRef, Picture, PictureXML } from "./types"

export const exportPictureToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  picture: Picture | undefined
): PictureXML | undefined => {
  if (!picture) return undefined

  if (isRawPictureRef(picture)) {
    return { "xr:Ref": picture.rawRef }
  }

  const result: PictureXML = {}

  if (picture.type === "AbsolutePicture") {
    result["xr:Abs"] = picture.ref as string
  } else {
    const ref = picture.type === "StandardPicture" ? `StdPicture.${picture.ref}` : `CommonPicture.${picture.ref}`
    result["xr:Ref"] = ref
  }

  result["xr:LoadTransparent"] = picture.loadTransparent

  if (picture.transparentPixel && picture.loadTransparent) {
    result["xr:TransparentPixel"] = { _x: picture.transparentPixel.x, _y: picture.transparentPixel.y }
  }

  return result
}

registerTypeRule("Picture", "exportToXML", exportPictureToXML)
