import { exportBorderToXML } from "~/packages/core/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/packages/core/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/packages/core/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/packages/core/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormFieldToXML } from "~/packages/core/metadata/forms/elements/formField/exportToXML"
import { LabelField, LabelFieldXML } from "~/packages/core/metadata/forms/elements/labelField/types"
import { exportEventsToXML } from "~/packages/core/metadata/forms/events/exportToXML"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

export const exportLabelFieldToXML = (context: Context, data: LabelField | undefined): LabelFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(context, data)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(context, data.backColor),
    Border: exportBorderToXML(context, data.border),
    BorderColor: exportColorToXML(context, data.borderColor),
    Font: exportFontToXML(context, data.font),
    Format: exportI8nTextToXML(context, data.format),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    Hyperlink: data.hyperlink,
    MarkNegatives: data.markNegatives,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    PasswordMode: data.passwordMode,
    TextColor: exportColorToXML(context, data.textColor),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "LabelField", exportLabelFieldToXML)
