import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importBorderFromEnterprise } from "~/metadata/commonObjects/border/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormDecorationFromEnterprise } from "~/metadata/forms/elements/formDecoration/importFromEnterprise"
import { PictureDecoration, PictureDecorationEnterprise } from "~/metadata/forms/elements/pictureDecoration/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ImportFromEnterpriseReturn } from "../types"

const importPictureDecorationEventsFromEnterprise = (
  data:
    | {
        Нажатие?: string
        НачалоПеретаскивания?: string
        ОкончаниеПеретаскивания?: string
        Перетаскивание?: string
        ПроверкаПеретаскивания?: string
      }
    | undefined
):
  | {
      click?: string
      dragStart?: string
      dragEnd?: string
      drag?: string
      dragCheck?: string
    }
  | undefined => {
  if (!data) return undefined

  const result: {
    click?: string
    dragStart?: string
    dragEnd?: string
    drag?: string
    dragCheck?: string
  } = {}

  if (data.Нажатие !== undefined) result.click = data.Нажатие
  if (data.НачалоПеретаскивания !== undefined) result.dragStart = data.НачалоПеретаскивания
  if (data.ОкончаниеПеретаскивания !== undefined) result.dragEnd = data.ОкончаниеПеретаскивания
  if (data.Перетаскивание !== undefined) result.drag = data.Перетаскивание
  if (data.ПроверкаПеретаскивания !== undefined) result.dragCheck = data.ПроверкаПеретаскивания

  return Object.keys(result).length > 0 ? result : undefined
}

export const importPictureDecorationFromEnterprise = <
  T extends PictureDecorationEnterprise | undefined,
  N extends string | undefined,
>(
  context: ConfigurationContext,
  data: T,
  name: N
): ImportFromEnterpriseReturn<T, PictureDecoration, N> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<T, PictureDecoration, N>

  const baseFields = importFormDecorationFromEnterprise(context, data, name)

  const result: ImportFromEnterpriseReturn<T, PictureDecoration, N> = {
    ...baseFields,
    elementType: FormElementType.PictureDecoration,
  }

  const hyperlink = importBooleanFromEnterprise(context, data.Гиперссылка)
  if (hyperlink !== undefined) result.hyperlink = hyperlink

  const picture = importPictureFromEnterprise(context, data.Картинка)
  if (picture !== undefined) result.picture = picture

  if (data.Масштаб !== undefined) result.scale = data.Масштаб

  const zoomable = importBooleanFromEnterprise(context, data.Масштабировать)
  if (zoomable !== undefined) result.zoomable = zoomable

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const pictureSize = importSystemEnumerationFromEnterprise<SE.PictureSize>(
    context,
    data.РазмерКартинки,
    SE.PictureSizeFromEnterprise
  )
  if (pictureSize !== undefined) result.pictureSize = pictureSize

  const enableStartDrag = importBooleanFromEnterprise(context, data.РазрешитьНачалоПеретаскивания)
  if (enableStartDrag !== undefined) result.enableStartDrag = enableStartDrag

  const enableDrag = importBooleanFromEnterprise(context, data.РазрешитьПеретаскивание)
  if (enableDrag !== undefined) result.enableDrag = enableDrag

  const border = importBorderFromEnterprise(context, data.Рамка)
  if (border !== undefined) result.border = border

  const fileDragMode = importSystemEnumerationFromEnterprise<SE.FileDragMode>(
    context,
    data.СпособПеретаскиванияФайлов,
    SE.FileDragModeFromEnterprise
  )
  if (fileDragMode !== undefined) result.fileDragMode = fileDragMode

  if (data.ТекстНевыбраннойКартинки !== undefined) result.nonselectedPictureText = data.ТекстНевыбраннойКартинки

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const events = importPictureDecorationEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result as ImportFromEnterpriseReturn<T, PictureDecoration, N>
}

registerMetadata(
  "ImportFromEnterprise",
  "PictureDecoration",
  importPictureDecorationFromEnterprise as (
    context: ConfigurationContext,
    data: PictureDecorationEnterprise | undefined
  ) => PictureDecoration | undefined
)
