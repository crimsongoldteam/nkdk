import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormItemAdditionToEnterprise } from "~/lib/metadata/forms/elements/formItemAddition/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import {
  ViewStatusAddition,
  ViewStatusAdditionEnterprise,
} from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportViewStatusAdditionToEnterprise = (
  data: ViewStatusAddition | undefined
): ViewStatusAdditionEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormItemAdditionToEnterprise(data)!,

    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    ЦветФона: exportColorToEnterprise(data.backColor),
    Рамка: exportBorderToEnterprise(data.border),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    ЦветФонаКнопок: exportColorToEnterprise(data.buttonsBackColor),
    Шрифт: exportFontToEnterprise(data.font),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    МаксимальнаяШирина: data.maxWidth,
    ЦветТекста: exportColorToEnterprise(data.textColor),
    ШрифтЗаголовка: exportFontToEnterprise(data.titleFont),
    ЦветТекстаЗаголовка: exportColorToEnterprise(data.titleTextColor),
    Ширина: data.width,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.ViewStatusAddition, exportViewStatusAdditionToEnterprise)
