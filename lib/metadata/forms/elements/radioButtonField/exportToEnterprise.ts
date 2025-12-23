import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceListToEnterprise } from "~/lib/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { RadioButtonField, RadioButtonFieldEnterprise } from "~/lib/metadata/forms/elements/radioButtonField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportRadioButtonFieldToEnterprise = (
  configurationSettings: ConfigurationSettings, data: RadioButtonField | undefined
): RadioButtonFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(configurationSettings, data)!,

    ВидПереключателя: exportSystemEnumerationToEnterprise(configurationSettings, data.radioButtonType, SE.RadioButtonTypeToEnterprise),
    ВысотаЗаголовкаЭлемента: data.itemTitleHeight,
    ВысотаЭлемента: data.itemHeight,
    КоличествоКолонок: data.columnsCount,
    ОдинаковаяШиринаКолонок: exportBooleanToEnterprise(configurationSettings, data.equalColumnsWidth),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    СписокВыбора: exportChoiceListToEnterprise(configurationSettings, data.choiceList),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    ЦветТекста: exportColorToEnterprise(configurationSettings, data.textColor),
    ЦветФона: exportColorToEnterprise(configurationSettings, data.backColor),
    ШиринаЭлемента: data.itemWidth,
    Шрифт: exportFontToEnterprise(configurationSettings, data.font),
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "RadioButtonField", exportRadioButtonFieldToEnterprise)
