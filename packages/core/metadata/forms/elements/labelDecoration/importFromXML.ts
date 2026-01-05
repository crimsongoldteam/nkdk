import { importBorderFromXML } from "~/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormDecorationFromXML } from "~/metadata/forms/elements/formDecoration/importFromXML"
import { LabelDecoration, LabelDecorationXML } from "~/metadata/forms/elements/labelDecoration/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importLabelDecorationFromXML = (
  context: ConfigurationContext,
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
