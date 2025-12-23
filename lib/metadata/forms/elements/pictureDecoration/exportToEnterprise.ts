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
  configurationSettings: Context,
  data: PictureDecoration | undefined
): PictureDecorationEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormDecorationToEnterprise(configurationSettings, data)!,

    Гиперссылка: exportBooleanToEnterprise(configurationSettings, data.hyperlink),
    Картинка: exportPictureToEnterprise(configurationSettings, data.picture),
    Масштаб: data.scale,
    Масштабировать: exportBooleanToEnterprise(configurationSettings, data.zoomable),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    РазмерКартинки: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.pictureSize,
      SE.PictureSizeToEnterprise
    ),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(configurationSettings, data.enableStartDrag),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(configurationSettings, data.enableDrag),
    Рамка: exportBorderToEnterprise(configurationSettings, data.border),
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.fileDragMode,
      SE.FileDragModeToEnterprise
    ),
    ТекстНевыбраннойКартинки: data.nonselectedPictureText,
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "PictureDecoration", exportPictureDecorationToEnterprise)
