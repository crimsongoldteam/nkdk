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
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportLabelFieldToEnterprise = (
  configurationSettings: ConfigurationSettings, data: LabelField | undefined
): LabelFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(configurationSettings, data)!,

    АвтоМаксимальнаяВысота: exportBooleanToEnterprise(configurationSettings, data.autoMaxHeight),
    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(configurationSettings, data.autoMaxWidth),
    ВыделятьОтрицательные: exportBooleanToEnterprise(configurationSettings, data.markNegatives),
    Высота: data.height,
    Гиперссылка: exportBooleanToEnterprise(configurationSettings, data.hyperlink),
    МаксимальнаяВысота: data.maxHeight,
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    Рамка: exportBorderToEnterprise(configurationSettings, data.border),
    РастягиватьПоВертикали: exportBooleanToEnterprise(configurationSettings, data.verticalStretch),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(configurationSettings, data.horizontalStretch),
    РежимПароля: exportBooleanToEnterprise(configurationSettings, data.passwordMode),
    Формат: exportI8nTextToEnterprise(configurationSettings, data.format),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    ЦветТекста: exportColorToEnterprise(configurationSettings, data.textColor),
    ЦветФона: exportColorToEnterprise(configurationSettings, data.backColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(configurationSettings, data.font),
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "LabelField", exportLabelFieldToEnterprise)
