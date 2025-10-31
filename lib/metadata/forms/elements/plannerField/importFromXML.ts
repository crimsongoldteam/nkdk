import { importFormFieldFromXML } from "../formField/importFromXML"
import { TPlannerFieldXML, TPlannerField } from "./types"

export const importPlannerFieldFromXML = (xml: TPlannerFieldXML | undefined): TPlannerField | undefined => {
  if (!xml) return undefined 

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    height: xml.Height,
    wrappedTimeScaleHeaderHyperlink: xml.WrappedTimeScaleHeaderHyperlink,
    dimensionItemHyperlink: xml.DimensionItemHyperlink,
    timeScaleItemHyperlink: xml.TimeScaleItemHyperlink,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    enableStartDrag: xml.EnableStartDrag,
    enableDrag: xml.EnableDrag,
    verticalStretch: xml.VerticalStretch,
    horizontalStretch: xml.HorizontalStretch,
    width: xml.Width,
  }
}