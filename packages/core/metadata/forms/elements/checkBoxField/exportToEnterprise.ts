import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  CheckBoxField,
  CheckBoxFieldPartialEnterprise,
  CheckBoxFieldTypedEnterprise,
} from "~/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToEnterprise } from "~/metadata/forms/elements/formField/exportToEnterprise"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToPartialEnterpriseType, ToTypedEnterpriseType } from "~/metadata/metadataFactory/types"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export function exportCheckBoxFieldTypedToEnterprise<From extends CheckBoxField | undefined>(
  context: ConfigurationContext,
  data: From
): ToTypedEnterpriseType<From> {
  if (data === undefined) return undefined as ToTypedEnterpriseType<From>

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportCheckBoxFieldPropsToEnterprise(context, data)

  const result: CheckBoxFieldTypedEnterprise = {
    Тип: "ПолеФлажок",
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ToTypedEnterpriseType<From>
}

export function exportCheckBoxFieldPartialToEnterprise<From extends CheckBoxField | undefined>(
  context: ConfigurationContext,
  data: From
): ToPartialEnterpriseType<From> {
  if (data === undefined) return undefined as ToPartialEnterpriseType<From>

  const baseFields = exportFormFieldToEnterprise(context, data)

  const props = exportCheckBoxFieldPropsToEnterprise(context, data)

  const result: CheckBoxFieldPartialEnterprise = {
    ...baseFields,
    ...props,
  }

  return sortObject(result) as ToPartialEnterpriseType<From>
}

const exportCheckBoxFieldPropsToEnterprise = (
  context: ConfigurationContext,
  data: CheckBoxField
): CheckBoxFieldPartialEnterprise => {
  const result: CheckBoxFieldPartialEnterprise = {}

  const checkBoxType = exportSystemEnumerationToEnterprise(context, data.checkBoxType, SE.CheckBoxTypeToEnterprise)
  if (checkBoxType !== undefined) result.ВидФлажка = checkBoxType

  if (data.itemTitleHeight !== undefined) result.ВысотаЗаголовкаЭлемента = data.itemTitleHeight

  if (data.itemHeight !== undefined) result.ВысотаЭлемента = data.itemHeight

  const equalItemsWidth = exportBooleanToEnterprise(context, data.equalItemsWidth)
  if (equalItemsWidth !== undefined) result.ОдинаковаяШиринаЭлементов = equalItemsWidth

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const threeState = exportBooleanToEnterprise(context, data.threeState)
  if (threeState !== undefined) result.ТриСостояния = threeState

  const editFormat = exportI8nTextToEnterprise(context, data.editFormat)
  if (editFormat !== undefined) result.ФорматРедактирования = editFormat

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

registerMetadata("ExportPartialToEnterprise", "CheckBoxField", exportCheckBoxFieldPartialToEnterprise)
registerMetadata("ExportTypedToEnterprise", "CheckBoxField", exportCheckBoxFieldTypedToEnterprise)
