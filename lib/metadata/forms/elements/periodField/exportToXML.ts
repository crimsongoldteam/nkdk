import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TPeriodFieldXML, TPeriodField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportPeriodFieldToXML = (data: TPeriodField | undefined): TPeriodFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Border: exportBorderToXML(data.border),
    BorderColor: exportColorToXML(data.borderColor),
    Font: exportFontToXML(data.font),
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    Events: data.events ? {
       Selection: data.events.selection,
    } : undefined,
  }
}

registerExport(ZElementType.enum.PeriodField, exportPeriodFieldToXML)