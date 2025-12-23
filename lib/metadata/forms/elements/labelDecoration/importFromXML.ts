import { importBorderFromXML } from "~/lib/metadata/commonObjects/border/importFromXML"
import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { LabelDecoration, LabelDecorationXML } from "~/lib/metadata/forms/elements/labelDecoration/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importLabelDecorationFromXML = (
  configurationSettings: ConfigurationSettings, xml: LabelDecorationXML | undefined
): LabelDecoration | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormDecorationFromXML(configurationSettings, xml)!,
    elementType: FormElementType.LabelDecoration,

    backColor: importColorFromXML(configurationSettings, xml.BackColor),
    border: importBorderFromXML(configurationSettings, xml.Border),
    borderColor: importColorFromXML(configurationSettings, xml.BorderColor),
    groupVerticalAlign: xml.GroupVerticalAlign,
    horizontalAlign: xml.HorizontalAlign,
    hyperlink: xml.Hyperlink,
    titleHeight: xml.TitleHeight,
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    verticalAlign: xml.VerticalAlign,
    events: importEventsFromXML(configurationSettings, xml.Events),
  })
}

registerMetadata("ImportFromXML", "LabelDecoration", importLabelDecorationFromXML)
