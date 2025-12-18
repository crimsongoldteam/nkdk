import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { PictureDecoration, PictureDecorationEnterprise } from "~/lib/metadata/forms/elements/pictureDecoration/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPictureDecorationToEnterprise = (
  data: PictureDecoration | undefined,
  configurationSettings: ConfigurationSettings
): PictureDecorationEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormDecorationToEnterprise(data, configurationSettings)!,

    Рамка: exportBorderToEnterprise(data.border, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag, configurationSettings),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag, configurationSettings),
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(
      data.fileDragMode,
      SE.FileDragModeToEnterprise,
      configurationSettings
    ),
    Гиперссылка: exportBooleanToEnterprise(data.hyperlink, configurationSettings),
    ТекстНевыбраннойКартинки: data.nonselectedPictureText,
    Картинка: exportPictureToEnterprise(data.picture, configurationSettings),
    РазмерКартинки: exportSystemEnumerationToEnterprise(
      data.pictureSize,
      SE.PictureSizeToEnterprise,
      configurationSettings
    ),
    Масштаб: data.scale,
    Масштабировать: exportBooleanToEnterprise(data.zoomable, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "PictureDecoration", exportPictureDecorationToEnterprise)
