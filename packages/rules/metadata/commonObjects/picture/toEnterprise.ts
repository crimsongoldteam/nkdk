import { definePropertyTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { isRawPictureRef, Picture, PictureEnterprise } from "./types"

export const exportPictureToEnterprise = (params: { value: Picture | undefined }): PictureEnterprise | undefined => {
  const { value: picture } = params

  if (!picture || isRawPictureRef(picture) || !picture.ref) return undefined

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

export const metadataPropertyRule000 = definePropertyTypeRule("Picture", "exportToEnterprise", exportPictureToEnterprise)
