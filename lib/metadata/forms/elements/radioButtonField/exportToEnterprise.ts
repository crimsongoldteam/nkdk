import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceListToEnterprise } from "~/lib/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { RadioButtonField, RadioButtonFieldEnterprise } from "~/lib/metadata/forms/elements/radioButtonField/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportRadioButtonFieldToEnterprise = (
  context: Context,
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
