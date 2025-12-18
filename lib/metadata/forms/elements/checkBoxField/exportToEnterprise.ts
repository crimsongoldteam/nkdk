import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { CheckBoxField, CheckBoxFieldEnterprise } from "~/lib/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportCheckBoxFieldToEnterprise = (
  data: CheckBoxField | undefined,
  configurationSettings: ConfigurationSettings
): CheckBoxFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    ВидФлажка: exportSystemEnumerationToEnterprise(
      data.checkBoxType,
      SE.CheckBoxTypeToEnterprise,
      configurationSettings
    ),
    ВысотаЗаголовкаЭлемента: data.itemTitleHeight,
    ВысотаЭлемента: data.itemHeight,
    ОдинаковаяШиринаЭлементов: exportBooleanToEnterprise(data.equalItemsWidth, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    ТриСостояния: exportBooleanToEnterprise(data.threeState, configurationSettings),
    ФорматРедактирования: exportI8nTextToEnterprise(data.editFormat, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    ШиринаЭлемента: data.itemWidth,
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  })
}

registerMetadata("ExportToEnterprise", "CheckBoxField", exportCheckBoxFieldToEnterprise)
