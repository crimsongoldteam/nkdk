import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAML } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { exportBooleanToYAML } from "../boolean/exportToYAML"
import { type Picture, type PictureEnterprise, type PictureEnterpriseExtended } from "./types"

export function exportPictureToYAML(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  picture: Picture | undefined
): PictureEnterprise | undefined {
  if (!picture) return undefined

  let ref: PictureEnterprise | undefined

  if (picture.type === "StandardPicture") {
    const result = exportSystemEnumerationToYAML(context, undefined, picture.ref, SE.PictureLibToEnterprise)

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
      result.ПрозрачныйФон = exportBooleanToYAML(context, undefined, _rule, picture.loadTransparent)
    }

    if (hasTransparentPixel) {
      result.ПрозрачныйПиксель = picture.transparentPixel
      // For pictures with transparent pixel, even if loadTransparent matches default, we need to include it
      if (result.ПрозрачныйФон === undefined) {
        result.ПрозрачныйФон = exportBooleanToYAML(context, undefined, _rule, picture.loadTransparent)
      }
    }

    return result
  }

  return ref
}
