import { importChoiceListFromXML } from "~/metadata/commonObjects/choiceList/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { RadioButtonField, RadioButtonFieldXML } from "~/metadata/forms/elements/radioButtonField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importRadioButtonFieldFromXML<To extends RadioButtonField | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined as To

  const { elementType: _, ...restFields } = baseFields

  const result: RadioButtonField = {
    elementType: FormElementType.RadioButtonField,
    ...restFields,
  }

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  const choiceList = importChoiceListFromXML(context, xml.ChoiceList)
  if (choiceList !== undefined) result.choiceList = choiceList

  if (xml.ColumnsCount !== undefined) result.columnsCount = xml.ColumnsCount

  if (xml.EqualColumnsWidth !== undefined) result.equalColumnsWidth = xml.EqualColumnsWidth

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.ItemHeight !== undefined) result.itemHeight = xml.ItemHeight

  if (xml.ItemTitleHeight !== undefined) result.itemTitleHeight = xml.ItemTitleHeight

  if (xml.ItemWidth !== undefined) result.itemWidth = xml.ItemWidth

  if (xml.RadioButtonType !== undefined) result.radioButtonType = xml.RadioButtonType

  const textColor = importColorFromXML(context, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as To
}

registerMetadata("ImportFromXML", "RadioButtonField", importRadioButtonFieldFromXML)
