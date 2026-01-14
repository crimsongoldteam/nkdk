import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import { PictureField, PictureFieldXML } from "~/metadata/forms/elements/pictureField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importPictureFieldFromXML<To extends PictureField | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined as To

  const { elementType: _, ...restFields } = baseFields

  const result: PictureField = {
    elementType: FormElementType.PictureField,
    ...restFields,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  const border = importBorderFromXML(context, xml.Border)
  if (border !== undefined) result.border = border

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.EnableDrag !== undefined) result.enableDrag = xml.EnableDrag

  if (xml.EnableStartDrag !== undefined) result.enableStartDrag = xml.EnableStartDrag

  if (xml.FileDragMode !== undefined) result.fileDragMode = xml.FileDragMode

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.Hyperlink !== undefined) result.hyperlink = xml.Hyperlink

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.NonselectedPictureText !== undefined) result.nonselectedPictureText = xml.NonselectedPictureText

  if (xml.PictureSize !== undefined) result.pictureSize = xml.PictureSize

  if (xml.Scale !== undefined) result.scale = xml.Scale

  const textColor = importColorFromXML(context, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  const valuesPicture = importPictureFromXML(context, xml.ValuesPicture)
  if (valuesPicture !== undefined) result.valuesPicture = valuesPicture

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Width !== undefined) result.width = xml.Width

  if (xml.Zoomable !== undefined) result.zoomable = xml.Zoomable

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as To
}

registerMetadata("ImportFromXML", "PictureField", importPictureFieldFromXML)
