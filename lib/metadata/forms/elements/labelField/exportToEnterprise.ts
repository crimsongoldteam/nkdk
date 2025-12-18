import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { LabelField, LabelFieldEnterprise } from "~/lib/metadata/forms/elements/labelField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportLabelFieldToEnterprise = (
  data: LabelField | undefined,
  configurationSettings: ConfigurationSettings
): LabelFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(data.autoMaxHeight, configurationSettings),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    Рамка: exportBorderToEnterprise(data.border, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    Формат: exportI8nTextToEnterprise(data.format, configurationSettings),
    Высота: data.height,
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch, configurationSettings),
    Гиперссылка: exportBooleanToEnterprise(data.hyperlink, configurationSettings),
    ВыделятьОтрицательные: exportBooleanToEnterprise(data.markNegatives, configurationSettings),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    РежимПароля: exportBooleanToEnterprise(data.passwordMode, configurationSettings),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    РастягиватьПоВертикали: exportBooleanToEnterprise(data.verticalStretch, configurationSettings),
    Ширина: data.width,
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  }
}

registerMetadata("ExportToEnterprise", "LabelField", exportLabelFieldToEnterprise)
