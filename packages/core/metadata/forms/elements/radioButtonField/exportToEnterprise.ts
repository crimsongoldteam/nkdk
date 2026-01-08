import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceListToEnterprise } from "~/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { RadioButtonField, RadioButtonFieldEnterprise } from "~/metadata/forms/elements/radioButtonField/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportRadioButtonFieldToEnterprise = (
  context: ConfigurationContext,
  data: RadioButtonField | undefined
): RadioButtonFieldEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)

  const result: RadioButtonFieldEnterprise = {
    ...baseFields,
  }

  const radioButtonType = exportSystemEnumerationToEnterprise(
    context,
    data.radioButtonType,
    SE.RadioButtonTypeToEnterprise
  )
  if (radioButtonType !== undefined) result.ВидПереключателя = radioButtonType

  if (data.itemTitleHeight !== undefined) result.ВысотаЗаголовкаЭлемента = data.itemTitleHeight

  if (data.itemHeight !== undefined) result.ВысотаЭлемента = data.itemHeight

  if (data.columnsCount !== undefined) result.КоличествоКолонок = data.columnsCount

  const equalColumnsWidth = exportBooleanToEnterprise(context, data.equalColumnsWidth)
  if (equalColumnsWidth !== undefined) result.ОдинаковаяШиринаКолонок = equalColumnsWidth

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const choiceList = exportChoiceListToEnterprise(context, data.choiceList)
  if (choiceList !== undefined) result.СписокВыбора = choiceList

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const textColor = exportColorToEnterprise(context, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  const backColor = exportColorToEnterprise(context, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  if (data.itemWidth !== undefined) result.ШиринаЭлемента = data.itemWidth

  const font = exportFontToEnterprise(context, data.font)
  if (font !== undefined) result.Шрифт = font

  const events = exportEventsToEnterprise(context, data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportToEnterprise", "RadioButtonField", exportRadioButtonFieldToEnterprise)
