import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { LabelDecoration, LabelDecorationXML } from "~/lib/metadata/forms/elements/labelDecoration/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importLabelDecorationFromXML = (
  context: Context,
  xml: LabelDecorationXML | undefined
): LabelDecoration | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormDecorationFromXML(context, xml)!,
    elementType: FormElementType.LabelDecoration,

    backColor: importColorFromXML(context, xml.BackColor),
    border: importBorderFromXML(context, xml.Border),
    borderColor: importColorFromXML(context, xml.BorderColor),
    groupVerticalAlign: xml.GroupVerticalAlign,
    horizontalAlign: xml.HorizontalAlign,
    hyperlink: xml.Hyperlink,
    titleHeight: xml.TitleHeight,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalAlign: xml.VerticalAlign,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "LabelDecoration", importLabelDecorationFromXML)
