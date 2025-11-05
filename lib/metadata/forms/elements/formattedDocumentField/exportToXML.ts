import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TFormattedDocumentFieldXML, TFormattedDocumentField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportFormattedDocumentFieldToXML = (data: TFormattedDocumentField | undefined): TFormattedDocumentFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    Font: exportFontToXML(data.font),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Output: data.output,
    SelectedText: data.selectedText,
    TextColor: exportColorToXML(data.textColor),
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: data.events ? {
       BeforeWrite: data.events.beforeWrite,
       BeforePrint: data.events.beforePrint,
       AfterWrite: data.events.afterWrite,
    } : undefined,
  }
}

registerExport(ZElementType.enum.FormattedDocumentField, exportFormattedDocumentFieldToXML)