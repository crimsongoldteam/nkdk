import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormDecorationFromXML } from "~/metadata/forms/elements/formDecoration/importFromXML"
import { LabelDecoration, LabelDecorationXML } from "~/metadata/forms/elements/labelDecoration/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ToXMLType } from "~/metadata/metadataFactory/types"

export function importLabelDecorationFromXML<To extends LabelDecoration | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importFormDecorationFromXML(context, xml)

  const result: LabelDecoration = {
    ...baseFields,
    elementType: FormElementType.LabelDecoration,
  }

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  const border = importBorderFromXML(context, xml.Border)
  if (border !== undefined) result.border = border

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.GroupVerticalAlign !== undefined) result.groupVerticalAlign = xml.GroupVerticalAlign

  if (xml.HorizontalAlign !== undefined) result.horizontalAlign = xml.HorizontalAlign

  if (xml.Hyperlink !== undefined) result.hyperlink = xml.Hyperlink

  if (xml.TitleHeight !== undefined) result.titleHeight = xml.TitleHeight

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlign !== undefined) result.verticalAlign = xml.VerticalAlign

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as To
}

registerMetadata("ImportFromXML", "LabelDecoration", importLabelDecorationFromXML)
