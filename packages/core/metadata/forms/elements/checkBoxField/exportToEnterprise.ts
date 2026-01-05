import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { CheckBoxField, CheckBoxFieldEnterprise } from "~/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportCheckBoxFieldToEnterprise = (
  context: ConfigurationContext,
  data: CheckBoxField | undefined
): CheckBoxFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(context, data)!,

    ВидФлажка: exportSystemEnumerationToEnterprise(context, data.checkBoxType, SE.CheckBoxTypeToEnterprise),
    ВысотаЗаголовкаЭлемента: data.itemTitleHeight,
    ВысотаЭлемента: data.itemHeight,
    ОдинаковаяШиринаЭлементов: exportBooleanToEnterprise(context, data.equalItemsWidth),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    ТриСостояния: exportBooleanToEnterprise(context, data.threeState),
    ФорматРедактирования: exportI8nTextToEnterprise(context, data.editFormat),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    ШиринаЭлемента: data.itemWidth,
    Шрифт: exportFontToEnterprise(context, data.font),
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "CheckBoxField", exportCheckBoxFieldToEnterprise)
