import { exportFormFieldToXML } from "../formField/exportToXML"
import { TChartFieldXML, TChartField } from "./types"

export const exportChartFieldToXML = (data: TChartField | undefined): TChartFieldXML | undefined => {
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
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    Width: data.width,
  }
}