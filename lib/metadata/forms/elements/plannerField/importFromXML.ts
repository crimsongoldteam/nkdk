import { importFormFieldFromXML } from "../formField/importFromXML"
import { TPlannerFieldXML, TPlannerField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importPlannerFieldFromXML = (xml: TPlannerFieldXML | undefined): TPlannerField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.PlannerField,
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

registerImport(ZElementType.enum.PlannerField, importPlannerFieldFromXML)