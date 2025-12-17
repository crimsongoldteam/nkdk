import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { LabelField, LabelFieldEnterprise } from "~/lib/metadata/forms/elements/labelField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"

export const exportLabelFieldToEnterprise = (data: LabelField | undefined): LabelFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    ЦветФона: exportColorToEnterprise(data.backColor),
    Рамка: exportBorderToEnterprise(data.border),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    Шрифт: exportFontToEnterprise(data.font),
    Формат: exportI8nTextToEnterprise(data.format),
    Высота: data.height,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    Гиперссылка: exportBooleanToEnterprise(data.hyperlink),
    ВыделятьОтрицательные: exportBooleanToEnterprise(data.markNegatives),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    РежимПароля: exportBooleanToEnterprise(data.passwordMode),
    ЦветТекста: exportColorToEnterprise(data.textColor),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch),
    Ширина: data.width,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.LabelField, exportLabelFieldToEnterprise)
