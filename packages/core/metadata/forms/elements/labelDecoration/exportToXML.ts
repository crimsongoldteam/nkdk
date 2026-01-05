import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/metadata/context/types"
import { exportFormDecorationToXML } from "~/metadata/forms/elements/formDecoration/exportToXML"
import { LabelDecoration, LabelDecorationXML } from "~/metadata/forms/elements/labelDecoration/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportLabelDecorationToXML = (
  context: Context,
  data: LabelDecoration | undefined
): LabelDecorationXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormDecorationToXML(context, data)!,

    BackColor: exportColorToXML(context, data.backColor),
    Border: exportBorderToXML(context, data.border),
    BorderColor: exportColorToXML(context, data.borderColor),
    GroupVerticalAlign: data.groupVerticalAlign,
    HorizontalAlign: data.horizontalAlign,
    Hyperlink: data.hyperlink,
    TitleHeight: data.titleHeight,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalAlign: data.verticalAlign,
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "LabelDecoration", exportLabelDecorationToXML)
