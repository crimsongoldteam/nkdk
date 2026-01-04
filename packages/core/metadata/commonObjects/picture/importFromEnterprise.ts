import { Context } from "../../context/types"
import { importSystemEnumerationFromEnterprise } from "../../systemEnumerations/importFromEnterprise"
import * as SE from "../../systemEnumerations/types"
import { Picture, PictureEnterprise } from "./types"

export const importPictureFromEnterprise = (
  context: Context,
  data: PictureEnterprise | undefined
): Picture | undefined => {
  if (!data) return undefined

  // Проверяем, является ли это стандартной картинкой
  if (data in SE.PictureLibFromEnterprise) {
    const standardPicture = importSystemEnumerationFromEnterprise(context, data, SE.PictureLibFromEnterprise)
    if (standardPicture) {
      return {
        ref: standardPicture,
        type: "StandardPicture",
        loadTransparent: false,
      }
    }
  }

  // Обычная картинка
  return {
    ref: data as string,
    type: "CommonPicture",
    loadTransparent: false,
  }
}

