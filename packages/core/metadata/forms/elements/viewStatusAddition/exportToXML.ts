import { exportBorderToXML } from "~/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormItemAdditionToXML } from "~/metadata/forms/elements/formItemAddition/exportToXML"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/metadata/forms/elements/viewStatusAddition/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportViewStatusAdditionToXML = (
  context: ConfigurationContext,
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
