import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceListToEnterprise } from "~/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { RadioButtonField, RadioButtonFieldEnterprise } from "~/metadata/forms/elements/radioButtonField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportRadioButtonFieldToEnterprise = (
  context: ConfigurationContext,
  data: RadioButtonField | undefined
): RadioButtonFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(context, data)!,

    ВидПереключателя: exportSystemEnumerationToEnterprise(
      context,
      data.radioButtonType,
      SE.RadioButtonTypeToEnterprise
    ),
    ВысотаЗаголовкаЭлемента: data.itemTitleHeight,
    ВысотаЭлемента: data.itemHeight,
    КоличествоКолонок: data.columnsCount,
    ОдинаковаяШиринаКолонок: exportBooleanToEnterprise(context, data.equalColumnsWidth),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    СписокВыбора: exportChoiceListToEnterprise(context, data.choiceList),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    ШиринаЭлемента: data.itemWidth,
    Шрифт: exportFontToEnterprise(context, data.font),
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "RadioButtonField", exportRadioButtonFieldToEnterprise)
