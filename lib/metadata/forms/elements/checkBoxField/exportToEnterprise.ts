import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { CheckBoxField, CheckBoxFieldEnterprise } from "~/lib/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportCheckBoxFieldToEnterprise = (
  data: CheckBoxField | undefined
): CheckBoxFieldEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToEnterprise(data)!,

    ЦветФона: exportColorToEnterprise(data.backColor),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    ВидФлажка: exportSystemEnumerationToEnterprise(data.checkBoxType, SE.CheckBoxTypeToEnterprise),
    ФорматРедактирования: exportI8nTextToEnterprise(data.editFormat),
    ОдинаковаяШиринаЭлементов: exportBooleanToEnterprise(data.equalItemsWidth),
    Шрифт: exportFontToEnterprise(data.font),
    ВысотаЭлемента: data.itemHeight,
    ВысотаЗаголовкаЭлемента: data.itemTitleHeight,
    ШиринаЭлемента: data.itemWidth,
    ЦветТекста: exportColorToEnterprise(data.textColor),
    ТриСостояния: exportBooleanToEnterprise(data.threeState),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.CheckBoxField, exportCheckBoxFieldToEnterprise)
