import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { CheckBoxField, CheckBoxFieldXML } from "~/metadata/forms/elements/checkBoxField/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importCheckBoxFieldFromXML<To extends CheckBoxField | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined as To

  const result: CheckBoxField = {
    ...baseFields,
    elementType: FormElementType.CheckBoxField,
  }

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.CheckBoxType !== undefined) result.checkBoxType = xml.CheckBoxType

  const editFormat = importI8nTextFromXML(context, xml.EditFormat)
  if (editFormat !== undefined) result.editFormat = editFormat

  if (xml.EqualItemsWidth !== undefined) result.equalItemsWidth = xml.EqualItemsWidth

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.ItemHeight !== undefined) result.itemHeight = xml.ItemHeight

  if (xml.ItemTitleHeight !== undefined) result.itemTitleHeight = xml.ItemTitleHeight

  if (xml.ItemWidth !== undefined) result.itemWidth = xml.ItemWidth

  const textColor = importColorFromXML(context, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  if (xml.ThreeState !== undefined) result.threeState = xml.ThreeState

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as To
}

registerMetadata("ImportFromXML", "CheckBoxField", importCheckBoxFieldFromXML)
