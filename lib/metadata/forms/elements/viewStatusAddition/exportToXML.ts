import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormItemAdditionToXML } from "../formItemAddition/exportToXML"
import { TViewStatusAdditionXML, TViewStatusAddition } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportViewStatusAdditionToXML = (data: TViewStatusAddition | undefined): TViewStatusAdditionXML | undefined => {
  if (!data) return undefined

  const base = exportFormItemAdditionToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
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
  }
}

registerExport(ZElementType.enum.ViewStatusAddition, exportViewStatusAdditionToXML)