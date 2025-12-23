import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { PictureField, PictureFieldEnterprise } from "~/lib/metadata/forms/elements/pictureField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPictureFieldToEnterprise = (
  configurationSettings: Context,
  data: PictureField | undefined
): PictureFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(configurationSettings, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(configurationSettings, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(configurationSettings, data.autoMaxWidth),
    Высота: data.height,
    Гиперссылка: exportBooleanToEnterprise(configurationSettings, data.hyperlink),
    КартинкаЗначений: exportPictureToEnterprise(configurationSettings, data.valuesPicture),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
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
    РастягиватьПоВертикали: exportBooleanToEnterprise(configurationSettings, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.fileDragMode,
      SE.FileDragModeToEnterprise
    ),
    ТекстНевыбраннойКартинки: data.nonselectedPictureText,
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    ЦветТекста: exportColorToEnterprise(configurationSettings, data.textColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(configurationSettings, data.font),
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "PictureField", exportPictureFieldToEnterprise)
