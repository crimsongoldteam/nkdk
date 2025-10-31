import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TPeriodFieldXML, TPeriodField } from "./types"

export const exportPeriodFieldToXML = (data: TPeriodField | undefined): TPeriodFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Border: exportBorderToXML(data.border),
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    BorderColor: exportColorToXML(data.borderColor),
    Width: data.width,
    Font: exportFontToXML(data.font),
  }
}