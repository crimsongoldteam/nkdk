import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  FormattedDocumentField,
  FormattedDocumentFieldXML,
} from "~/metadata/forms/elements/formattedDocumentField/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importFormattedDocumentFieldFromXML = (
  context: ConfigurationContext,
  xml: FormattedDocumentFieldXML | undefined
): FormattedDocumentField | undefined => {
  if (!xml) return undefined

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined

  const result: FormattedDocumentField = {
    ...baseFields,
    elementType: FormElementType.FormattedDocumentField,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.Output !== undefined) result.output = xml.Output

  if (xml.SelectedText !== undefined) result.selectedText = xml.SelectedText

  const textColor = importColorFromXML(context, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromXML", "FormattedDocumentField", importFormattedDocumentFieldFromXML)
