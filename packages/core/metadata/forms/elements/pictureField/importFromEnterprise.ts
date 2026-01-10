import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importBorderFromEnterprise } from "~/metadata/commonObjects/border/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { PictureField, PictureFieldEnterprise } from "~/metadata/forms/elements/pictureField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const importPictureFieldEventsFromEnterprise = (
  data: {
    ПриИзменении?: string
    Нажатие?: string
    НачалоПеретаскивания?: string
    ОкончаниеПеретаскивания?: string
    Перетаскивание?: string
    ПроверкаПеретаскивания?: string
  } | undefined
): {
  onChange?: string
  click?: string
  dragStart?: string
  dragEnd?: string
  drag?: string
  dragCheck?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
    click?: string
    dragStart?: string
    dragEnd?: string
    drag?: string
    dragCheck?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении
  if (data.Нажатие !== undefined) result.click = data.Нажатие
  if (data.НачалоПеретаскивания !== undefined) result.dragStart = data.НачалоПеретаскивания
  if (data.ОкончаниеПеретаскивания !== undefined) result.dragEnd = data.ОкончаниеПеретаскивания
  if (data.Перетаскивание !== undefined) result.drag = data.Перетаскивание
  if (data.ПроверкаПеретаскивания !== undefined) result.dragCheck = data.ПроверкаПеретаскивания

  return Object.keys(result).length > 0 ? result : undefined
}

export const importPictureFieldFromEnterprise = <From extends PictureFieldEnterprise | undefined, Name extends string>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, PictureField, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, PictureField, Name>

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const result: ImportFromEnterpriseReturn<From, PictureField, Name> = {
    ...baseFields,
    elementType: FormElementType.PictureField,
  }

  const autoMaxHeight = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяВысота)
  if (autoMaxHeight !== undefined) result.autoMaxHeight = autoMaxHeight

  const autoMaxWidth = importBooleanFromEnterprise(context, data.АвтоМаксимальнаяШирина)
  if (autoMaxWidth !== undefined) result.autoMaxWidth = autoMaxWidth

  if (data.Высота !== undefined) result.height = data.Высота

  const hyperlink = importBooleanFromEnterprise(context, data.Гиперссылка)
  if (hyperlink !== undefined) result.hyperlink = hyperlink

  const valuesPicture = importPictureFromEnterprise(context, data.КартинкаЗначений)
  if (valuesPicture !== undefined) result.valuesPicture = valuesPicture

  if (data.МаксимальнаяВысота !== undefined) result.maxHeight = data.МаксимальнаяВысота

  if (data.МаксимальнаяШирина !== undefined) result.maxWidth = data.МаксимальнаяШирина

  if (data.Масштаб !== undefined) result.scale = data.Масштаб

  const zoomable = importBooleanFromEnterprise(context, data.Масштабировать)
  if (zoomable !== undefined) result.zoomable = zoomable

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
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

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const fileDragMode = importSystemEnumerationFromEnterprise<SE.FileDragMode>(
    context,
    data.СпособПеретаскиванияФайлов,
    SE.FileDragModeFromEnterprise
  )
  if (fileDragMode !== undefined) result.fileDragMode = fileDragMode

  if (data.ТекстНевыбраннойКартинки !== undefined) result.nonselectedPictureText = data.ТекстНевыбраннойКартинки

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const font = importFontFromEnterprise(context, data.Шрифт)
  if (font !== undefined) result.font = font

  const events = importPictureFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "PictureField", importPictureFieldFromEnterprise)
