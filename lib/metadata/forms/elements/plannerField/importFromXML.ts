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
    dimensionItemHyperlink: xml.DimensionItemHyperlink,
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    timeScaleItemHyperlink: xml.TimeScaleItemHyperlink,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    wrappedTimeScaleHeaderHyperlink: xml.WrappedTimeScaleHeaderHyperlink,
  }
}

registerImport(ZElementType.enum.PlannerField, importPlannerFieldFromXML)