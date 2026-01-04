import { Context } from "../../context/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { type Picture, type PictureEnterprise } from "./types"

export function exportPictureToEnterprise(
  context: Context,
  picture: Picture | undefined
): PictureEnterprise | undefined {
  if (!picture) return undefined

  if (picture.type === "StandardPicture") {
    const result = exportSystemEnumerationToEnterprise(context, picture.ref, SE.PictureLibToEnterprise)

    if (!result) throw new Error(`Picture ref ${picture.ref} not found in PictureLibToEnterprise`)

    return result
  }

  if (!picture.loadTransparent) {
    return {
      Ссылка: picture.ref,
      Прозрачность: false,
    }
  }

  return picture.ref
}
