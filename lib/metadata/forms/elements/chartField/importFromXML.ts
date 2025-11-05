import { importFormFieldFromXML } from "../formField/importFromXML"
import { TChartFieldXML, TChartField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importChartFieldFromXML = (xml: TChartFieldXML | undefined): TChartField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.ChartField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    events: xml.Events ? {
       selection: xml.Events.Selection,
       detailProcessing: xml.Events.DetailProcessing,
       onActivate: xml.Events.OnActivate,
    } : undefined,
  }
}

registerImport(ZElementType.enum.ChartField, importChartFieldFromXML)