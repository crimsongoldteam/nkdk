import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/types"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAML } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { exportBooleanToEnterprise } from "../boolean/exportToEnterprise"
import { type Picture, type PictureEnterprise, type PictureEnterpriseExtended } from "./types"

export function exportPictureToEnterprise(
  context: ConfigurationContext,
  _rule: PropertyRule<any> | undefined,
  picture: Picture | undefined
): PictureEnterprise | undefined {
  if (!picture) return undefined

  let ref: PictureEnterprise | undefined

  if (picture.type === "StandardPicture") {
    const result = exportSystemEnumerationToYAML<SE.PictureLibEnterprise>(
      context,
      { type: "SystemEnumeration", typeSE: "PictureLib" },
      picture.ref
    )

    if (!result) throw new Error(`Picture ref ${picture.ref} not found in PictureLibToEnterprise`)

    ref = result
  } else {
    ref = picture.ref
  }

  // Default values based on picture type
  const defaultLoadTransparent = picture.type === "StandardPicture" ? true : false
  const hasCustomLoadTransparent = picture.loadTransparent !== defaultLoadTransparent
  const hasTransparentPixel = !!picture.transparentPixel

  if (hasCustomLoadTransparent || hasTransparentPixel) {
    const result: PictureEnterpriseExtended = { Ссылка: ref }

    if (hasCustomLoadTransparent) {
      result.ПрозрачныйФон = exportBooleanToEnterprise(context, undefined, picture.loadTransparent)
    }

    if (hasTransparentPixel) {
      result.ПрозрачныйПиксель = picture.transparentPixel
      // For pictures with transparent pixel, even if loadTransparent matches default, we need to include it
      if (result.ПрозрачныйФон === undefined) {
        result.ПрозрачныйФон = exportBooleanToEnterprise(context, undefined, picture.loadTransparent)
      }
    }

    return result
  }

  return ref
}

registerTypeRule("Picture", "exportToEnterprise", exportPictureToEnterprise)
