import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportChoiceListToEnterprise } from "~/metadata/commonObjects/choiceList/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  RadioButtonField,
  RadioButtonFieldPartialEnterprise,
  RadioButtonFieldTypedEnterprise,
} from "~/metadata/forms/elements/radioButtonField/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { ImportExportReturn } from "../types"

export function exportRadioButtonFieldTypedToEnterprise<From extends RadioButtonField | undefined>(
  context: ConfigurationContext,
  data: From
): ImportExportReturn<From, ToTypedEnterpriseType<From>> {
  if (data === undefined) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportRadioButtonFieldPropsToEnterprise(context, data)

  const result: RadioButtonFieldTypedEnterprise = {
    Тип: "ПолеПереключателя",
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ImportExportReturn<From, ToTypedEnterpriseType<From>>
}

export function exportRadioButtonFieldPartialToEnterprise<From extends RadioButtonField | undefined>(
  context: ConfigurationContext,
  data: From
): ImportExportReturn<From, ToPartialEnterpriseType<From>> {
  if (data === undefined) return undefined

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportRadioButtonFieldPropsToEnterprise(context, data)

  const result: RadioButtonFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ImportExportReturn<From, ToPartialEnterpriseType<From>>
}

const exportRadioButtonFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: RadioButtonField
): RadioButtonFieldPartialEnterprise => {
  const result: RadioButtonFieldPartialEnterprise = {}

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

registerMetadata("ExportPartialToEnterprise", "RadioButtonField", exportRadioButtonFieldPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "RadioButtonField", exportRadioButtonFieldTypedToEnterprise)
