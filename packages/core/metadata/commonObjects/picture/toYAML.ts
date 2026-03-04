import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { registerTypeRule } from "~/metadata/metadataFactory/types/factory"
import { ConfigurationContext } from "../../context/types"
import { exportSystemEnumerationToYAMLDeprecated } from "../../systemEnumerations/toYAML"
import * as SE from "../../systemEnumerations/types"
import { exportBooleanToYAML } from "../boolean/toYAML"
import { type Picture, type PictureYAML, type PictureYAMLExtended } from "./types"

export function exportPictureToYAML(
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
  picture: Picture | undefined
): PictureYAML | undefined {
  if (!picture) return undefined

  let ref: PictureYAML | undefined

  if (picture.type === "StandardPicture") {
    const result = exportSystemEnumerationToYAMLDeprecated<SE.PictureLibYAML>(
      context,
      { type: "SystemEnumeration", typeSE: "PictureLib" },
      picture.ref
    )

    if (!result) throw new Error(`Picture ref ${picture.ref} not found in PictureLibToYAML`)

    ref = result
  } else {
    ref = picture.ref
  }

  // Default values based on picture type
  const defaultLoadTransparent = picture.type === "StandardPicture" ? true : false
  const hasCustomLoadTransparent = picture.loadTransparent !== defaultLoadTransparent
  const hasTransparentPixel = !!picture.transparentPixel

  if (hasCustomLoadTransparent || hasTransparentPixel) {
    const result: PictureYAMLExtended = { Ссылка: ref }

    if (hasCustomLoadTransparent) {
      result.ПрозрачныйФон = exportBooleanToYAML(context, undefined, picture.loadTransparent)
    }

    if (hasTransparentPixel) {
      result.ПрозрачныйПиксель = picture.transparentPixel
      // For pictures with transparent pixel, even if loadTransparent matches default, we need to include it
      if (result.ПрозрачныйФон === undefined) {
        result.ПрозрачныйФон = exportBooleanToYAML(context, undefined, picture.loadTransparent)
      }
    }

    return result
  }

  return ref
}

registerTypeRule("Picture", "exportToYAML", exportPictureToYAML)
