import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { PictureField, PictureFieldEnterprise } from "~/metadata/forms/elements/pictureField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportPictureFieldToEnterprise = (
  context: ConfigurationContext,
  data: PictureField | undefined
): PictureFieldEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)

  const result: PictureFieldEnterprise = {
    ...baseFields,
  }

  const autoMaxHeight = exportBooleanToEnterprise(context, data.autoMaxHeight)
  if (autoMaxHeight !== undefined) result.АвтоМаксимальнаяВысота = autoMaxHeight

  const autoMaxWidth = exportBooleanToEnterprise(context, data.autoMaxWidth)
  if (autoMaxWidth !== undefined) result.АвтоМаксимальнаяШирина = autoMaxWidth

  if (data.height !== undefined) result.Высота = data.height

  const hyperlink = exportBooleanToEnterprise(context, data.hyperlink)
  if (hyperlink !== undefined) result.Гиперссылка = hyperlink

  const valuesPicture = exportPictureToEnterprise(context, data.valuesPicture)
  if (valuesPicture !== undefined) result.КартинкаЗначений = valuesPicture

  if (data.maxHeight !== undefined) result.МаксимальнаяВысота = data.maxHeight

  if (data.maxWidth !== undefined) result.МаксимальнаяШирина = data.maxWidth

  if (data.scale !== undefined) result.Масштаб = data.scale

  const zoomable = exportBooleanToEnterprise(context, data.zoomable)
  if (zoomable !== undefined) result.Масштабировать = zoomable

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const pictureSize = exportSystemEnumerationToEnterprise(context, data.pictureSize, SE.PictureSizeToEnterprise)
  if (pictureSize !== undefined) result.РазмерКартинки = pictureSize

  const enableStartDrag = exportBooleanToEnterprise(context, data.enableStartDrag)
  if (enableStartDrag !== undefined) result.РазрешитьНачалоПеретаскивания = enableStartDrag

  const enableDrag = exportBooleanToEnterprise(context, data.enableDrag)
  if (enableDrag !== undefined) result.РазрешитьПеретаскивание = enableDrag

  const border = exportBorderToEnterprise(context, data.border)
  if (border !== undefined) result.Рамка = border

  const verticalStretch = exportBooleanToEnterprise(context, data.verticalStretch)
  if (verticalStretch !== undefined) result.РастягиватьПоВертикали = verticalStretch

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const fileDragMode = exportSystemEnumerationToEnterprise(context, data.fileDragMode, SE.FileDragModeToEnterprise)
  if (fileDragMode !== undefined) result.СпособПеретаскиванияФайлов = fileDragMode

  if (data.nonselectedPictureText !== undefined) result.ТекстНевыбраннойКартинки = data.nonselectedPictureText

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const textColor = exportColorToEnterprise(context, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  if (data.width !== undefined) result.Ширина = data.width

  const font = exportFontToEnterprise(context, data.font)
  if (font !== undefined) result.Шрифт = font

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "PictureField", exportPictureFieldToEnterprise)
