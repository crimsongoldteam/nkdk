import { exportFormFieldToXML } from "../formField/exportToXML"
import { TChartFieldXML, TChartField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER: string[] = []

export const exportChartFieldToXML = (data: TChartField | undefined): TChartFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TChartFieldXML>( {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
  }, ORDER)
}

registerExport(ZElementType.enum.ChartField, exportChartFieldToXML)