import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormDecorationFromXML } from "~/metadata/forms/elements/formDecoration/importFromXML"
import { PictureDecoration, PictureDecorationXML } from "~/metadata/forms/elements/pictureDecoration/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importPictureDecorationFromXML = (
  context: ConfigurationContext,
  xml: PictureDecorationXML | undefined
): PictureDecoration | undefined => {
  if (!xml) return undefined

  const baseFields = importFormDecorationFromXML(context, xml)
  if (!baseFields) return undefined

  const { elementType: _, ...restFields } = baseFields

  const result: PictureDecoration = {
    elementType: FormElementType.PictureDecoration,
    ...restFields,
  }

  const border = importBorderFromXML(context, xml.Border)
  if (border !== undefined) result.border = border

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.EnableDrag !== undefined) result.enableDrag = xml.EnableDrag

  if (xml.EnableStartDrag !== undefined) result.enableStartDrag = xml.EnableStartDrag

  if (xml.FileDragMode !== undefined) result.fileDragMode = xml.FileDragMode

  if (xml.Hyperlink !== undefined) result.hyperlink = xml.Hyperlink

  if (xml.NonselectedPictureText !== undefined) result.nonselectedPictureText = xml.NonselectedPictureText

  const picture = importPictureFromXML(context, xml.Picture)
  if (picture !== undefined) result.picture = picture

  if (xml.PictureSize !== undefined) result.pictureSize = xml.PictureSize

  if (xml.Scale !== undefined) result.scale = xml.Scale

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.Zoomable !== undefined) result.zoomable = xml.Zoomable

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportFromXML", "PictureDecoration", importPictureDecorationFromXML)
