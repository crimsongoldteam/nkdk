import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TTextDocumentFieldXML, TTextDocumentField } from "./types"

export const exportTextDocumentFieldToXML = (data: TTextDocumentField | undefined): TTextDocumentFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Output: data.output,
    SelectedText: data.selectedText,
    Height: data.height,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    BorderColor: exportColorToXML(data.borderColor),
    TextColor: exportColorToXML(data.textColor),
    BackColor: exportColorToXML(data.backColor),
    Width: data.width,
    Font: exportFontToXML(data.font),
  }
}