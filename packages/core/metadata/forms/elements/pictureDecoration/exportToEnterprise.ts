import { exportBooleanToEnterprise } from "~/packages/core/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/packages/core/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/packages/core/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/packages/core/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormDecorationToEnterprise } from "~/packages/core/metadata/forms/elements/formDecoration/exportToEnterprise"
import {
  PictureDecoration,
  PictureDecorationEnterprise,
} from "~/packages/core/metadata/forms/elements/pictureDecoration/types"
import { exportEventsToEnterprise } from "~/packages/core/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export const exportPictureDecorationToEnterprise = (
  context: Context,
  data: PictureDecoration | undefined
): PictureDecorationEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormDecorationToEnterprise(context, data)!,

    Гиперссылка: exportBooleanToEnterprise(context, data.hyperlink),
    Картинка: exportPictureToEnterprise(context, data.picture),
    Масштаб: data.scale,
    Масштабировать: exportBooleanToEnterprise(context, data.zoomable),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РазмерКартинки: exportSystemEnumerationToEnterprise(context, data.pictureSize, SE.PictureSizeToEnterprise),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(context, data.enableStartDrag),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(context, data.enableDrag),
    Рамка: exportBorderToEnterprise(context, data.border),
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(
      context,
      data.fileDragMode,
      SE.FileDragModeToEnterprise
    ),
    ТекстНевыбраннойКартинки: data.nonselectedPictureText,
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "PictureDecoration", exportPictureDecorationToEnterprise)
