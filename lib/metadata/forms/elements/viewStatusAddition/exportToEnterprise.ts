import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
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
  data: ViewStatusAddition | undefined,
  configurationSettings: ConfigurationSettings
): ViewStatusAdditionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    Рамка: exportBorderToEnterprise(data.border, configurationSettings),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    ЦветТекстаЗаголовка: exportColorToEnterprise(data.titleTextColor, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    ЦветФонаКнопок: exportColorToEnterprise(data.buttonsBackColor, configurationSettings),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    ШрифтЗаголовка: exportFontToEnterprise(data.titleFont, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "ViewStatusAddition", exportViewStatusAdditionToEnterprise)
