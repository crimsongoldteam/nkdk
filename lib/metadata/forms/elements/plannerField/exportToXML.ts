import { exportFormFieldToXML } from "../formField/exportToXML"
import { TPlannerFieldXML, TPlannerField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER: string[] = []

export const exportPlannerFieldToXML = (data: TPlannerField | undefined): TPlannerFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TPlannerFieldXML>( {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    DimensionItemHyperlink: data.dimensionItemHyperlink,
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    Height: data.height,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    TimeScaleItemHyperlink: data.timeScaleItemHyperlink,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    WrappedTimeScaleHeaderHyperlink: data.wrappedTimeScaleHeaderHyperlink,
  }, ORDER)
}

registerExport(ZElementType.enum.PlannerField, exportPlannerFieldToXML)