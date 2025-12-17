import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceListToEnterprise } from "~/lib/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { RadioButtonField, RadioButtonFieldEnterprise } from "~/lib/metadata/forms/elements/radioButtonField/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportRadioButtonFieldToEnterprise = (
  data: RadioButtonField | undefined
): RadioButtonFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    ЦветФона: exportColorToEnterprise(data.backColor),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    СписокВыбора: exportChoiceListToEnterprise(data.choiceList),
    КоличествоКолонок: data.columnsCount,
    ОдинаковаяШиринаКолонок: exportBooleanToEnterprise(data.equalColumnsWidth),
    Шрифт: exportFontToEnterprise(data.font),
    ВысотаЭлемента: data.itemHeight,
    ВысотаЗаголовкаЭлемента: data.itemTitleHeight,
    ШиринаЭлемента: data.itemWidth,
    ВидПереключателя: exportSystemEnumerationToEnterprise(data.radioButtonType, SE.RadioButtonTypeToEnterprise),
    ЦветТекста: exportColorToEnterprise(data.textColor),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.RadioButtonField, exportRadioButtonFieldToEnterprise)
