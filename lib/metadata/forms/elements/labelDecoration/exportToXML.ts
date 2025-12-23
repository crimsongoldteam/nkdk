import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { LabelDecoration, LabelDecorationXML } from "~/lib/metadata/forms/elements/labelDecoration/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportLabelDecorationToXML = (
  configurationSettings: Context,
  data: LabelDecoration | undefined
): LabelDecorationXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormDecorationToXML(configurationSettings, data)!,

    BackColor: exportColorToXML(configurationSettings, data.backColor),
    Border: exportBorderToXML(configurationSettings, data.border),
    BorderColor: exportColorToXML(configurationSettings, data.borderColor),
    GroupVerticalAlign: data.groupVerticalAlign,
    HorizontalAlign: data.horizontalAlign,
    Hyperlink: data.hyperlink,
    TitleHeight: data.titleHeight,
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    VerticalAlign: data.verticalAlign,
    Events: exportEventsToXML(configurationSettings, data.events),
  })
}

registerMetadata("ExportToXML", "LabelDecoration", exportLabelDecorationToXML)
