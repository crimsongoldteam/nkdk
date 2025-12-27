import { exportBooleanToEnterprise } from "~/packages/core/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/packages/core/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/packages/core/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/packages/core/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { CheckBoxField, CheckBoxFieldEnterprise } from "~/packages/core/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToEnterprise } from "~/packages/core/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/packages/core/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export const exportCheckBoxFieldToEnterprise = (
  context: Context,
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
