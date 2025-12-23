import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { PictureDecoration, PictureDecorationEnterprise } from "~/lib/metadata/forms/elements/pictureDecoration/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
