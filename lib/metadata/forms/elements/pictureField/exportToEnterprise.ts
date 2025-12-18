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
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPictureFieldToEnterprise = (
  data: PictureField | undefined,
  configurationSettings: ConfigurationSettings
): PictureFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    Высота: data.height,
    Гиперссылка: exportBooleanToEnterprise(data.hyperlink, configurationSettings),
    КартинкаЗначений: exportPictureToEnterprise(data.valuesPicture, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    Масштаб: data.scale,
    Масштабировать: exportBooleanToEnterprise(data.zoomable, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    РазмерКартинки: exportSystemEnumerationToEnterprise(
      data.pictureSize,
      SE.PictureSizeToEnterprise,
      configurationSettings
    ),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag, configurationSettings),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag, configurationSettings),
    Рамка: exportBorderToEnterprise(data.border, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(
      data.fileDragMode,
      SE.FileDragModeToEnterprise,
      configurationSettings
    ),
    ТекстНевыбраннойКартинки: data.nonselectedPictureText,
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "PictureField", exportPictureFieldToEnterprise)
