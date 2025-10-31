import { exportFormFieldToXML } from "../formField/exportToXML"
import { TPlannerFieldXML, TPlannerField } from "./types"

export const exportPlannerFieldToXML = (data: TPlannerField | undefined): TPlannerFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    Height: data.height,
    WrappedTimeScaleHeaderHyperlink: data.wrappedTimeScaleHeaderHyperlink,
    DimensionItemHyperlink: data.dimensionItemHyperlink,
    TimeScaleItemHyperlink: data.timeScaleItemHyperlink,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    EnableStartDrag: data.enableStartDrag,
    EnableDrag: data.enableDrag,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    Width: data.width,
  }
}