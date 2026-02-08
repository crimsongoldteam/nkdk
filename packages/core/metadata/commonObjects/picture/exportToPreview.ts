import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/typeRulesFactory"
import { ConfigurationContext } from "../../context/types"
import { Picture, PicturePreview } from "./types"

export const exportPictureToPreview = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  picture: Picture | undefined
): PicturePreview | undefined => {
  if (!picture || !picture.ref) return undefined

  if (picture.type === "AbsolutePicture") {
    return { Type: "AbsolutePicture" as const }
  }

  if (picture.type === "StandardPicture") {
    return { Type: "Picture" as const, Value: `PictureLib.${picture.ref}` }
  }

  if (picture.type === "CommonPicture") {
    return { Type: "Picture" as const, Value: `CommonPictures.${picture.ref}` }
  }

  return undefined
}

registerTypeRule("Picture", "exportToPreview", exportPictureToPreview)
