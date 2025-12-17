import { ConfigurationSettings } from "../../configurationSettings/types"
import { exportSystemEnumerationToEnterprise } from "../../systemEnumerations/exportToEnterprise"
import * as SE from "../../systemEnumerations/types"
import { type Picture } from "./types"

export const exportPictureToEnterprise = (
  picture: Picture | undefined,
  configurationSettings: ConfigurationSettings
): string | undefined => {
  if (!picture) return undefined

  if (picture.type === "StandardPicture") {
    const result = exportSystemEnumerationToEnterprise(picture.ref, SE.PictureLibToEnterprise, configurationSettings)

    if (!result) throw new Error(`Picture ref ${picture.ref} not found in PictureLibToEnterprise`)

    return result
  }

  if (picture.type === "CommonPicture") {
    return picture.ref as string
  }

  return picture.ref as string
}
