import { exportBooleanToEnterprise } from "~/packages/core/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/packages/core/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/packages/core/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/packages/core/metadata/commonObjects/font/exportToEnterprise"
import { exportPictureToEnterprise } from "~/packages/core/metadata/commonObjects/pictures/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/packages/core/metadata/forms/elements/formField/exportToEnterprise"
import { PictureField, PictureFieldEnterprise } from "~/packages/core/metadata/forms/elements/pictureField/types"
import { exportEventsToEnterprise } from "~/packages/core/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export const exportPictureFieldToEnterprise = (
  context: Context,
  data: PictureField | undefined
): PictureFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(context, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    Высота: data.height,
    Гиперссылка: exportBooleanToEnterprise(context, data.hyperlink),
    КартинкаЗначений: exportPictureToEnterprise(context, data.valuesPicture),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    Масштаб: data.scale,
    Масштабировать: exportBooleanToEnterprise(context, data.zoomable),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РазмерКартинки: exportSystemEnumerationToEnterprise(context, data.pictureSize, SE.PictureSizeToEnterprise),
    РазрешитьНачалоПеретаскивания: exportBooleanToEnterprise(context, data.enableStartDrag),
    РазрешитьПеретаскивание: exportBooleanToEnterprise(context, data.enableDrag),
    Рамка: exportBorderToEnterprise(context, data.border),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    СпособПеретаскиванияФайлов: exportSystemEnumerationToEnterprise(
      context,
      data.fileDragMode,
      SE.FileDragModeToEnterprise
    ),
    ТекстНевыбраннойКартинки: data.nonselectedPictureText,
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(context, data.font),
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "PictureField", exportPictureFieldToEnterprise)
