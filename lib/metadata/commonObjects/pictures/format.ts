import { Context } from "../../context/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { type Picture } from "./types"

export const exportPictureToEnterprise = (picture: Picture | undefined, context: Context): string | undefined => {
  if (!picture) return undefined

  if (picture.type === "StandardPicture") {
    const result = exportSystemEnumerationToEnterprise(context, picture.ref, SE.PictureLibToEnterprise)

    if (!result) throw new Error(`Picture ref ${picture.ref} not found in PictureLibToEnterprise`)

    return result
  }

  if (picture.type === "CommonPicture") {
    return picture.ref as string
  }

  return picture.ref as string
}
