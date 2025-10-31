import { type TPicture } from "./types"
import * as SF from "~/lib/metadata/systemEnumerations/types"

export function formatPicture(picture: TPicture): string {
  if (picture.type === "StandardPicture") {
    // Получаем индексы массивов значений из enum'ов
    const standardValues = SF.ZStandardPicture.options
    const enterpriseValues = SF.ZStandardPictureEnterprise.options

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
