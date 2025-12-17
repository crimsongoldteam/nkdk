import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormItemAdditionToXML } from "~/lib/metadata/forms/elements/formItemAddition/exportToXML"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { ViewStatusAddition, ViewStatusAdditionXML } from "~/lib/metadata/forms/elements/viewStatusAddition/types"
import { registerExport } from "~/lib/xml/export/exporterFactory"

export const exportViewStatusAdditionToXML = (
  data: ViewStatusAddition | undefined
): ViewStatusAdditionXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormItemAdditionToXML(data)!,

    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor),
    Border: exportBorderToXML(data.border),
    BorderColor: exportColorToXML(data.borderColor),
    ButtonsBackColor: exportColorToXML(data.buttonsBackColor),
    Font: exportFontToXML(data.font),
    HorizontalAlign: data.horizontalAlign,
    HorizontalStretch: data.horizontalStretch,
    MaxWidth: data.maxWidth,
    TextColor: exportColorToXML(data.textColor),
    TitleFont: exportFontToXML(data.titleFont),
    TitleTextColor: exportColorToXML(data.titleTextColor),
    Width: data.width,
    UserVisible: exportUserVisibleToXML(data.userVisible),
  }
}

registerExport(FormElementType.ViewStatusAddition, exportViewStatusAdditionToXML)
