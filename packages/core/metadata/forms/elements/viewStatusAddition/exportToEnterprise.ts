import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { exportFormItemAdditionToEnterprise } from "~/metadata/forms/elements/formItemAddition/exportToEnterprise"
import { ViewStatusAddition, ViewStatusAdditionEnterprise } from "~/metadata/forms/elements/viewStatusAddition/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportViewStatusAdditionToEnterprise = (
  context: Context,
  data: ViewStatusAddition | undefined
): ViewStatusAdditionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToEnterprise(context, data)!,

    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    Рамка: exportBorderToEnterprise(context, data.border),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    ЦветТекстаЗаголовка: exportColorToEnterprise(context, data.titleTextColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    ЦветФонаКнопок: exportColorToEnterprise(context, data.buttonsBackColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(context, data.font),
    ШрифтЗаголовка: exportFontToEnterprise(context, data.titleFont),
  })
}

registerMetadata("ExportToEnterprise", "ViewStatusAddition", exportViewStatusAdditionToEnterprise)
