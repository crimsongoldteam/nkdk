import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importChoiceListFromEnterprise } from "~/metadata/commonObjects/choiceList/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { RadioButtonField, RadioButtonFieldEnterprise } from "~/metadata/forms/elements/radioButtonField/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const importRadioButtonFieldEventsFromEnterprise = (
  data: {
    ПриИзменении?: string
  } | undefined
): {
  onChange?: string
} | undefined => {
  if (!data) return undefined

  const result: {
    onChange?: string
  } = {}

  if (data.ПриИзменении !== undefined) result.onChange = data.ПриИзменении

  return Object.keys(result).length > 0 ? result : undefined
}

export const importRadioButtonFieldFromEnterprise = (
  context: ConfigurationContext,
  data: RadioButtonFieldEnterprise | undefined,
  name: string
): RadioButtonField | undefined => {
  if (!data) return undefined

  const baseFields = importFormFieldFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: RadioButtonField = {
    elementType: FormElementType.RadioButtonField,
    ...restFields,
  }

  const radioButtonType = importSystemEnumerationFromEnterprise<SE.RadioButtonType>(
    context,
    data.ВидПереключателя,
    SE.RadioButtonTypeFromEnterprise
  )
  if (radioButtonType !== undefined) result.radioButtonType = radioButtonType

  if (data.ВысотаЗаголовкаЭлемента !== undefined) result.itemTitleHeight = data.ВысотаЗаголовкаЭлемента

  if (data.ВысотаЭлемента !== undefined) result.itemHeight = data.ВысотаЭлемента

  if (data.КоличествоКолонок !== undefined) result.columnsCount = data.КоличествоКолонок

  const equalColumnsWidth = importBooleanFromEnterprise(context, data.ОдинаковаяШиринаКолонок)
  if (equalColumnsWidth !== undefined) result.equalColumnsWidth = equalColumnsWidth

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const choiceList = importChoiceListFromEnterprise(context, data.СписокВыбора)
  if (choiceList !== undefined) result.choiceList = choiceList

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const textColor = importColorFromEnterprise(context, data.ЦветТекста)
  if (textColor !== undefined) result.textColor = textColor

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  if (data.ШиринаЭлемента !== undefined) result.itemWidth = data.ШиринаЭлемента

  const font = importFontFromEnterprise(context, data.Шрифт)
  if (font !== undefined) result.font = font

  const events = importRadioButtonFieldEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromEnterprise", "RadioButtonField", importRadioButtonFieldFromEnterprise)

