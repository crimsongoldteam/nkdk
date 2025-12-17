import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { PictureDecoration, PictureDecorationEnterprise } from "~/lib/metadata/forms/elements/pictureDecoration/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPictureDecorationToEnterprise = (
  data: PictureDecoration | undefined
): PictureDecorationEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormDecorationToEnterprise(data)!,

    Рамка: exportBorderToEnterprise(data.border),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag),
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(data.fileDragMode, SE.FileDragModeToEnterprise),
    Гиперссылка: exportBooleanToEnterprise(data.hyperlink),
    ТекстНевыбраннойКартинки: data.nonselectedPictureText,
    Картинка: exportPictureToEnterprise(data.picture),
    РазмерКартинки: exportSystemEnumerationToEnterprise(data.pictureSize, SE.PictureSizeToEnterprise),
    Масштаб: data.scale,
    Масштабировать: exportBooleanToEnterprise(data.zoomable),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.PictureDecoration, exportPictureDecorationToEnterprise)
