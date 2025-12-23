import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { LabelField, LabelFieldEnterprise } from "~/lib/metadata/forms/elements/labelField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportLabelFieldToEnterprise = (
  context: Context,
  data: LabelField | undefined
): LabelFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(context, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(context, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    ВыделятьОтрицательные: exportBooleanToEnterprise(context, data.markNegatives),
    Высота: data.height,
    Гиперссылка: exportBooleanToEnterprise(context, data.hyperlink),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    Рамка: exportBorderToEnterprise(context, data.border),
    РастягиватьПоВертикали: exportBooleanToEnterprise(context, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    РежимПароля: exportBooleanToEnterprise(context, data.passwordMode),
    Формат: exportI8nTextToEnterprise(context, data.format),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(context, data.font),
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "LabelField", exportLabelFieldToEnterprise)
