import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/metadata/commonObjects/picture/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormDecorationPropsToEnterprise } from "~/metadata/forms/elements/formDecoration/exportToEnterprise"
import { PictureDecoration, PictureDecorationEnterprise } from "~/metadata/forms/elements/pictureDecoration/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportPictureDecorationToEnterprise = (
  context: ConfigurationContext,
  data: PictureDecoration | undefined
): PictureDecorationEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormDecorationPropsToEnterprise(context, data)

  const result: PictureDecorationEnterprise = {
    ...baseFields,
  }

  const hyperlink = exportBooleanToEnterprise(context, data.hyperlink)
  if (hyperlink !== undefined) result.Гиперссылка = hyperlink

  const picture = exportPictureToEnterprise(context, data.picture)
  if (picture !== undefined) result.Картинка = picture

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

  const fileDragMode = exportSystemEnumerationToEnterprise(context, data.fileDragMode, SE.FileDragModeToEnterprise)
  if (fileDragMode !== undefined) result.СпособПеретаскиванияФайлов = fileDragMode

  if (data.nonselectedPictureText !== undefined) result.ТекстНевыбраннойКартинки = data.nonselectedPictureText

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "PictureDecoration", exportPictureDecorationToEnterprise)
