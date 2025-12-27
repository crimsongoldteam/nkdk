import { importBorderFromXML } from "~/packages/core/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/packages/core/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/packages/core/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/packages/core/metadata/context/types"
import { importFormDecorationFromXML } from "~/packages/core/metadata/forms/elements/formDecoration/importFromXML"
import { LabelDecoration, LabelDecorationXML } from "~/packages/core/metadata/forms/elements/labelDecoration/types"
import { importEventsFromXML } from "~/packages/core/metadata/forms/events/importFromXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/packages/core/metadata/metadataFactory/types"

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
