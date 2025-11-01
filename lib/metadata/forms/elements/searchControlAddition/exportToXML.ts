import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportFormItemAdditionToXML } from "../formItemAddition/exportToXML"
import { TSearchControlAdditionXML, TSearchControlAddition } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportSearchControlAdditionToXML = (data: TSearchControlAddition | undefined): TSearchControlAdditionXML | undefined => {
  if (!data) return undefined

  const base = exportFormItemAdditionToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor),
    BorderColor: exportColorToXML(data.borderColor),
    Font: exportFontToXML(data.font),
    HorizontalStretch: data.horizontalStretch,
    MaxWidth: data.maxWidth,
    TextColor: exportColorToXML(data.textColor),
    Width: data.width,
  }
}

registerExport(ZElementType.enum.SearchControlAddition, exportSearchControlAdditionToXML)