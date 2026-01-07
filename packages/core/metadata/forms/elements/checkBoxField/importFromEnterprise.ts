import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { CheckBoxField, CheckBoxFieldEnterprise } from "~/metadata/forms/elements/checkBoxField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const importCheckBoxFieldEventsFromEnterprise = (
  data: { ПриИзменении?: string } | undefined
): { onChange?: string } | undefined => {
  if (!data) return undefined

  const result: { onChange?: string } = {}

  if (data.ПриИзменении !== undefined) {
    result.onChange = data.ПриИзменении
  }

  return Object.keys(result).length > 0 ? result : undefined
}

export const importCheckBoxFieldFromEnterprise = (
  context: ConfigurationContext,
  data: CheckBoxFieldEnterprise | undefined,
  name: string
): CheckBoxField | undefined => {
  if (!data) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: CheckBoxField = {
    elementType: FormElementType.CheckBoxField,
    ...restFields,
  }

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

  const events = importCheckBoxFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "CheckBoxField", importCheckBoxFieldFromEnterprise)
