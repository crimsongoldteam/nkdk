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
  xml: LabelDecorationXML | undefined,
  configurationSettings: ConfigurationSettings
): LabelDecoration | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormDecorationFromXML(xml, configurationSettings)!,
    elementType: FormElementType.LabelDecoration,

    backColor: importColorFromXML(xml.BackColor, configurationSettings),
    border: importBorderFromXML(xml.Border, configurationSettings),
    borderColor: importColorFromXML(xml.BorderColor, configurationSettings),
    groupVerticalAlign: xml.GroupVerticalAlign,
    horizontalAlign: xml.HorizontalAlign,
    hyperlink: xml.Hyperlink,
    titleHeight: xml.TitleHeight,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
    verticalAlign: xml.VerticalAlign,
    events: importEventsFromXML(xml.Events, configurationSettings),
  })
}

registerMetadata("ImportFromXML", "LabelDecoration", importLabelDecorationFromXML)
