import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importChoiceListFromEnterprise } from "~/metadata/commonObjects/choiceList/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromEnterprise } from "~/metadata/forms/elements/formField/importFromEnterprise"
import {
  RadioButtonField,
  RadioButtonFieldPartialEnterprise,
  RadioButtonFieldTypedEnterprise,
} from "~/metadata/forms/elements/radioButtonField/types"
import { importEventsFromEnterprise } from "~/metadata/forms/events/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  importFormElementTypeFromEnterprise,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export function importRadioButtonFieldTypedFromEnterprise<To extends RadioButtonField | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const baseFields = importFormFieldFromEnterprise(context, data, name)!

  const props = importRadioButtonFieldPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: RadioButtonField = {
    ...baseFields,
    ...props,
    elementType,
  }

  return result as To
}

export function importRadioButtonFieldPartialFromEnterprise<To extends RadioButtonField>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const baseFields = importFormFieldFromEnterprise(context, data, source.name)!

  const props = importRadioButtonFieldPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...baseFields,
    ...props,
    elementType: source.elementType, // Сохраняем elementType из source
  }

  return result
}

const importRadioButtonFieldPropsFromEnterprise = (
  context: ConfigurationContext,
  data: RadioButtonFieldTypedEnterprise | RadioButtonFieldPartialEnterprise | undefined
): Omit<Partial<RadioButtonField>, "elementType" | "name"> => {
  const result: Omit<Partial<RadioButtonField>, "elementType" | "name"> = {}

  if (data === undefined) return result

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
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
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

  const events = importEventsFromEnterprise(context, data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportPartialFromEnterprise", "RadioButtonField", importRadioButtonFieldPropsFromEnterprise)
