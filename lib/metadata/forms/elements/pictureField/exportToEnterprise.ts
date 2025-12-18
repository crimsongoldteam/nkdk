import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { PictureField, PictureFieldEnterprise } from "~/lib/metadata/forms/elements/pictureField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPictureFieldToEnterprise = (
  data: PictureField | undefined,
  configurationSettings: ConfigurationSettings
): PictureFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    Рамка: exportBorderToEnterprise(data.border, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag, configurationSettings),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag, configurationSettings),
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(
      data.fileDragMode,
      SE.FileDragModeToEnterprise,
      configurationSettings
    ),
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    Высота: data.height,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    Гиперссылка: exportBooleanToEnterprise(data.hyperlink, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ТекстНевыбраннойКартинки: data.nonselectedPictureText,
    РазмерКартинки: exportSystemEnumerationToEnterprise(
      data.pictureSize,
      SE.PictureSizeToEnterprise,
      configurationSettings
    ),
    Масштаб: data.scale,
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    КартинкаЗначений: exportPictureToEnterprise(data.valuesPicture, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    Ширина: data.width,
    Масштабировать: exportBooleanToEnterprise(data.zoomable, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  }
}

registerMetadata("ExportToEnterprise", "PictureField", exportPictureFieldToEnterprise)
