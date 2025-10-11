import { type TPicture } from "./types"
import { ZStandardPicture, ZStandardPictureEnterprise } from "../../systemEnumerations/systemEnumerations"

export function formatPicture(picture: TPicture): string {
  if (picture.type === "StandardPicture") {
    // Получаем индексы массивов значений из enum'ов
    const standardValues = ZStandardPicture.options
    const enterpriseValues = ZStandardPictureEnterprise.options

    // Находим индекс стандартной картинки
    const index = standardValues.indexOf(picture.ref as any)

    // Если индекс найден, возвращаем соответствующую enterprise-версию
    if (index !== -1) {
      return enterpriseValues[index]
    }

    return picture.ref as string
  } else if (picture.type === "CommonPicture") {
    return picture.ref as string
  }

  return picture.ref as string
}
