import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { Picture, PictureEnterprise } from "./types"

export const exportPictureToEnterprise = (
  _context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  picture: Picture | undefined
): PictureEnterprise | undefined => {
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

registerTypeRule("Picture", "exportToEnterprise", exportPictureToEnterprise)
