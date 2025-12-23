import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportFormItemAdditionToXML } from "~/lib/metadata/forms/elements/formItemAddition/exportToXML"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportViewStatusAdditionToXML = (
  context: Context,
  data: ViewStatusAddition | undefined
): ViewStatusAdditionXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToXML(context, data)!,

    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(context, data.backColor),
    Border: exportBorderToXML(context, data.border),
    BorderColor: exportColorToXML(context, data.borderColor),
    ButtonsBackColor: exportColorToXML(context, data.buttonsBackColor),
    Font: exportFontToXML(context, data.font),
    HorizontalAlign: data.horizontalAlign,
    HorizontalStretch: data.horizontalStretch,
    MaxWidth: data.maxWidth,
    TextColor: exportColorToXML(context, data.textColor),
    TitleFont: exportFontToXML(context, data.titleFont),
    TitleTextColor: exportColorToXML(context, data.titleTextColor),
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    Width: data.width,
  })
}

registerMetadata("ExportToXML", "ViewStatusAddition", exportViewStatusAdditionToXML)
