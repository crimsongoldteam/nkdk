import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportPictureToEnterprise } from "~/lib/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { PictureField, PictureFieldEnterprise } from "~/lib/metadata/forms/elements/pictureField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportPictureFieldToEnterprise = (data: PictureField | undefined): PictureFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    Рамка: exportBorderToEnterprise(data.border),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(data.enableDrag),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(data.enableStartDrag),
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(data.fileDragMode, SE.FileDragModeToEnterprise),
    Шрифт: exportFontToEnterprise(data.font),
    Высота: data.height,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    Гиперссылка: exportBooleanToEnterprise(data.hyperlink),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ТекстНевыбраннойКартинки: data.nonselectedPictureText,
    РазмерКартинки: exportSystemEnumerationToEnterprise(data.pictureSize, SE.PictureSizeToEnterprise),
    Масштаб: data.scale,
    ЦветТекста: exportColorToEnterprise(data.textColor),
    КартинкаЗначений: exportPictureToEnterprise(data.valuesPicture),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    Ширина: data.width,
    Масштабировать: exportBooleanToEnterprise(data.zoomable),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.PictureField, exportPictureFieldToEnterprise)
