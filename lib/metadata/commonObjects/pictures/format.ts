import { TPictureLib } from "~/lib/metadata/systemSets/types"
import { type Picture } from "./types"
import * as SystemSets from "~/lib/metadata/systemSets/types"

export function formatPicture(picture: Picture): string {
  if (picture.type === "StandardPicture") {
    // Получаем индексы массивов значений из enum'ов
    const standardValues = SystemSets.ZPictureLib.options
    const enterpriseValues = SystemSets.ZPictureLibEnterprise.options

    // Находим индекс стандартной картинки
    const index = standardValues.indexOf(picture.ref as TPictureLib)

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
