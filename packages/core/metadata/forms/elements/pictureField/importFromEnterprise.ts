import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importBorderFromEnterprise } from "~/metadata/commonObjects/border/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importPictureFromEnterprise } from "~/metadata/commonObjects/picture/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  PictureField,
  PictureFieldPartialEnterprise,
  PictureFieldTypedEnterprise,
} from "~/metadata/forms/elements/pictureField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importPictureFieldTypedFromEnterprise = (
  context: ConfigurationContext,
  data: PictureFieldTypedEnterprise | undefined,
  name: string
): PictureField | undefined => {
  if (data === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importPictureFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: PictureField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result
}

export const importPictureFieldPartialFromEnterprise = (
  context: ConfigurationContext,
  source: PictureField | undefined,
  data: PictureFieldPartialEnterprise | undefined
): PictureField | undefined => {
  if (source === undefined) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importPictureFieldPropsFromEnterprise(context, data)
  const result: PictureField = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importPictureFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: PictureFieldTypedEnterprise | PictureFieldPartialEnterprise | undefined
): Omit<Partial<PictureField>, "elementType" | "name"> => {
  const result: Omit<Partial<PictureField>, "elementType" | "name"> = {}

  if (data === undefined) return result

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

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "PictureField", importPictureFieldPropsFromEnterprise)
