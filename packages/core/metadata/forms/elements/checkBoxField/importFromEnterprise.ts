import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
} from "~/metadata/forms/elements/checkBoxField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  importFormElementTypeFromEnterprise,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
export function importCheckBoxFieldTypedFromEnterprise<To extends CheckBoxField | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importCheckBoxFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: CheckBoxField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result as To
}

export function importCheckBoxFieldPartialFromEnterprise<To extends CheckBoxField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importCheckBoxFieldPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importCheckBoxFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: CheckBoxFieldTypedEnterprise | CheckBoxFieldPartialEnterprise | undefined
): Omit<Partial<CheckBoxField>, "elementType" | "name"> => {
  const result: Omit<Partial<CheckBoxField>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const checkBoxType = importSystemEnumerationFromEnterprise<SE.CheckBoxType>(
    context,
    data.ВидФлажка,
    SE.CheckBoxTypeFromEnterprise
  )
  if (checkBoxType !== undefined) result.checkBoxType = checkBoxType

  if (data.ВысотаЗаголовкаЭлемента !== undefined) result.itemTitleHeight = data.ВысотаЗаголовкаЭлемента

  if (data.ВысотаЭлемента !== undefined) result.itemHeight = data.ВысотаЭлемента

  const equalItemsWidth = importBooleanFromEnterprise(context, data.ОдинаковаяШиринаЭлементов)
  if (equalItemsWidth !== undefined) result.equalItemsWidth = equalItemsWidth

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const threeState = importBooleanFromEnterprise(context, data.ТриСостояния)
  if (threeState !== undefined) result.threeState = threeState

  const editFormat = importI8nTextFromEnterprise(context, data.ФорматРедактирования)
  if (editFormat !== undefined) result.editFormat = editFormat

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  if (data.ШиринаЭлемента !== undefined) result.itemWidth = data.ШиринаЭлемента

  const font = importFontFromEnterprise(context, data.Шрифт)
  if (font !== undefined) result.font = font

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportPartialFromEnterprise", "CheckBoxField", importCheckBoxFieldPropsFromEnterprise)
