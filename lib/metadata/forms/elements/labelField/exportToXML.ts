import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TLabelFieldXML, TLabelField } from "./types"

export const exportLabelFieldToXML = (data: TLabelField | undefined): TLabelFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    MarkNegatives: data.markNegatives,
    Height: data.height,
    Hyperlink: data.hyperlink,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Border: exportBorderToXML(data.border),
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    PasswordMode: data.passwordMode,
    Format: data.format,
    BorderColor: exportColorToXML(data.borderColor),
    TextColor: exportColorToXML(data.textColor),
    BackColor: exportColorToXML(data.backColor),
    Width: data.width,
    Font: exportFontToXML(data.font),
  }
}