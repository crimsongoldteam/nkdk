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
  configurationSettings: Context,
  data: ViewStatusAddition | undefined
): ViewStatusAdditionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToEnterprise(configurationSettings, data)!,

    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(configurationSettings, data.autoMaxWidth),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    Рамка: exportBorderToEnterprise(configurationSettings, data.border),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    ЦветТекста: exportColorToEnterprise(configurationSettings, data.textColor),
    ЦветТекстаЗаголовка: exportColorToEnterprise(configurationSettings, data.titleTextColor),
    ЦветФона: exportColorToEnterprise(configurationSettings, data.backColor),
    ЦветФонаКнопок: exportColorToEnterprise(configurationSettings, data.buttonsBackColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(configurationSettings, data.font),
    ШрифтЗаголовка: exportFontToEnterprise(configurationSettings, data.titleFont),
  })
}

registerMetadata("ExportToEnterprise", "ViewStatusAddition", exportViewStatusAdditionToEnterprise)
