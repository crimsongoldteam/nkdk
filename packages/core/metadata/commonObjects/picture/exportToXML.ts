import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { Picture, PictureXML } from "./types"

export const exportPictureToXML = (
  _context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  picture: Picture | undefined
): PictureXML | undefined => {
  if (!picture) return undefined

  const result: PictureXML = {} as PictureXML

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
