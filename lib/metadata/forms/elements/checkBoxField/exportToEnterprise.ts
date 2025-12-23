import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/lib/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { CheckBoxField, CheckBoxFieldEnterprise } from "~/lib/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToEnterprise } from "~/lib/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportCheckBoxFieldToEnterprise = (
  configurationSettings: Context,
  data: CheckBoxField | undefined
): CheckBoxFieldEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToEnterprise(configurationSettings, data)!,

    ВидФлажка: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.checkBoxType,
      SE.CheckBoxTypeToEnterprise
    ),
    ВысотаЗаголовкаЭлемента: data.itemTitleHeight,
    ВысотаЭлемента: data.itemHeight,
    ОдинаковаяШиринаЭлементов: exportBooleanToEnterprise(configurationSettings, data.equalItemsWidth),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
    ТриСостояния: exportBooleanToEnterprise(configurationSettings, data.threeState),
    ФорматРедактирования: exportI8nTextToEnterprise(configurationSettings, data.editFormat),
    ЦветРамки: exportColorToEnterprise(configurationSettings, data.borderColor),
    ЦветТекста: exportColorToEnterprise(configurationSettings, data.textColor),
    ЦветФона: exportColorToEnterprise(configurationSettings, data.backColor),
    ШиринаЭлемента: data.itemWidth,
    Шрифт: exportFontToEnterprise(configurationSettings, data.font),
    События: exportEventsToEnterprise(configurationSettings, data.events),
  })
}

registerMetadata("ExportToEnterprise", "CheckBoxField", exportCheckBoxFieldToEnterprise)
