import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { LabelDecoration, LabelDecorationXML } from "~/lib/metadata/forms/elements/labelDecoration/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportLabelDecorationToXML = (
  data: LabelDecoration | undefined,
  configurationSettings: ConfigurationSettings
): LabelDecorationXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormDecorationToXML(data, configurationSettings)!,

    BackColor: exportColorToXML(data.backColor, configurationSettings),
    Border: exportBorderToXML(data.border, configurationSettings),
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
    GroupVerticalAlign: data.groupVerticalAlign,
    HorizontalAlign: data.horizontalAlign,
    Hyperlink: data.hyperlink,
    TitleHeight: data.titleHeight,
    VerticalAlign: data.verticalAlign,
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    Events: exportEventsToXML(data.events, configurationSettings),
  }
}

registerMetadata("ExportToXML", "LabelDecoration", exportLabelDecorationToXML)
