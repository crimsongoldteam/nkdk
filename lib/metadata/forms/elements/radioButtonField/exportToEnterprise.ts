import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceListToEnterprise } from "~/lib/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { RadioButtonField, RadioButtonFieldEnterprise } from "~/lib/metadata/forms/elements/radioButtonField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportRadioButtonFieldToEnterprise = (
  data: RadioButtonField | undefined,
  configurationSettings: ConfigurationSettings
): RadioButtonFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data, configurationSettings)!,

    ЦветФона: exportColorToEnterprise(data.backColor, configurationSettings),
    ЦветРамки: exportColorToEnterprise(data.borderColor, configurationSettings),
    СписокВыбора: exportChoiceListToEnterprise(data.choiceList, configurationSettings),
    КоличествоКолонок: data.columnsCount,
    ОдинаковаяШиринаКолонок: exportBooleanToEnterprise(data.equalColumnsWidth, configurationSettings),
    Шрифт: exportFontToEnterprise(data.font, configurationSettings),
    ВысотаЭлемента: data.itemHeight,
    ВысотаЗаголовкаЭлемента: data.itemTitleHeight,
    ШиринаЭлемента: data.itemWidth,
    ВидПереключателя: exportSystemEnumerationToEnterprise(
      data.radioButtonType,
      SE.RadioButtonTypeToEnterprise,
      configurationSettings
    ),
    ЦветТекста: exportColorToEnterprise(data.textColor, configurationSettings),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
    События: exportEventsToEnterprise(data.events, configurationSettings),
  }
}

registerMetadata("ExportToEnterprise", "RadioButtonField", exportRadioButtonFieldToEnterprise)
