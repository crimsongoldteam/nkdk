import { exportChoiceListToXML } from "~/metadata/commonObjects/choiceList/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { RadioButtonField, RadioButtonFieldXML } from "~/metadata/forms/elements/radioButtonField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportRadioButtonFieldToXML = (
  context: ConfigurationContext,
  data: RadioButtonField | undefined
): RadioButtonFieldXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  const result: RadioButtonFieldXML = {
    ...baseFields,
  }

  const backColor = exportColorToXML(context, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  const choiceList = exportChoiceListToXML(context, data.choiceList)
  if (choiceList !== undefined) result.ChoiceList = choiceList

  if (data.columnsCount !== undefined) result.ColumnsCount = data.columnsCount

  if (data.equalColumnsWidth !== undefined) result.EqualColumnsWidth = data.equalColumnsWidth

  const font = exportFontToXML(context, data.font)
  if (font !== undefined) result.Font = font

  if (data.itemHeight !== undefined) result.ItemHeight = data.itemHeight

  if (data.itemTitleHeight !== undefined) result.ItemTitleHeight = data.itemTitleHeight

  if (data.itemWidth !== undefined) result.ItemWidth = data.itemWidth

  if (data.radioButtonType !== undefined) result.RadioButtonType = data.radioButtonType

  const textColor = exportColorToXML(context, data.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result)
}

registerMetadata("ExportToXML", "RadioButtonField", exportRadioButtonFieldToXML)
