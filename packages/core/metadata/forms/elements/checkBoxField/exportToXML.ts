import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { CheckBoxField, CheckBoxFieldXML } from "~/metadata/forms/elements/checkBoxField/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function exportCheckBoxFieldToXML<From extends CheckBoxField | undefined>(
  context: ConfigurationContext,
  data: From
): ImportExportReturn<From, ToXMLType<From>> {
  if (data === undefined) return undefined as ImportExportReturn<From, ToXMLType<From>>

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  const result: CheckBoxFieldXML = {
    ...baseFields,
  }

  const backColor = exportColorToXML(context, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (data.checkBoxType !== undefined) result.CheckBoxType = data.checkBoxType

  const editFormat = exportI8nTextToXML(context, data.editFormat)
  if (editFormat !== undefined) result.EditFormat = editFormat

  if (data.equalItemsWidth !== undefined) result.EqualItemsWidth = data.equalItemsWidth

  const font = exportFontToXML(context, data.font)
  if (font !== undefined) result.Font = font

  if (data.itemHeight !== undefined) result.ItemHeight = data.itemHeight

  if (data.itemTitleHeight !== undefined) result.ItemTitleHeight = data.itemTitleHeight

  if (data.itemWidth !== undefined) result.ItemWidth = data.itemWidth

  const textColor = exportColorToXML(context, data.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  if (data.threeState !== undefined) result.ThreeState = data.threeState

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result) as ImportExportReturn<From, ToXMLType<From>>
}

registerMetadata("ExportToXML", "CheckBoxField", exportCheckBoxFieldToXML)
