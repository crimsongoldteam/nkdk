import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormItemAdditionToEnterprise } from "~/lib/metadata/forms/elements/formItemAddition/exportToEnterprise"
import {
  ViewStatusAddition,
  ViewStatusAdditionEnterprise,
} from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
