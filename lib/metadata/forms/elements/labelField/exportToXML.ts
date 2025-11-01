import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TLabelFieldXML, TLabelField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportLabelFieldToXML = (data: TLabelField | undefined): TLabelFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor),
    Border: exportBorderToXML(data.border),
    BorderColor: exportColorToXML(data.borderColor),
    Font: exportFontToXML(data.font),
    Format: data.format,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    Hyperlink: data.hyperlink,
    MarkNegatives: data.markNegatives,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    PasswordMode: data.passwordMode,
    TextColor: exportColorToXML(data.textColor),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
  }
}

registerExport(ZElementType.enum.LabelField, exportLabelFieldToXML)