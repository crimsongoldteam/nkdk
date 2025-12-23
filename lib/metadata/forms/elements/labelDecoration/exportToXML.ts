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
