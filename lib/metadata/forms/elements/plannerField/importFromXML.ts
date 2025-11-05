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
    events: xml.Events ? {
       selection: xml.Events.Selection,
       plannerActionClick: xml.Events.PlannerActionClick,
       uRLClick: xml.Events.URLClick,
       wrappedTimeScaleHeaderClick: xml.Events.WrappedTimeScaleHeaderClick,
       dimensionItemClick: xml.Events.DimensionItemClick,
       timeScaleItemClick: xml.Events.TimeScaleItemClick,
       dragStart: xml.Events.DragStart,
       commandGenerateProcessing: xml.Events.CommandGenerateProcessing,
       dragEnd: xml.Events.DragEnd,
       beforeStartQuickEdit: xml.Events.BeforeStartQuickEdit,
       beforeStartEdit: xml.Events.BeforeStartEdit,
       beforePrint: xml.Events.BeforePrint,
       beforeExpandDimensionItem: xml.Events.BeforeExpandDimensionItem,
       beforeCollapseDimensionItem: xml.Events.BeforeCollapseDimensionItem,
       beforeCreate: xml.Events.BeforeCreate,
       beforeDelete: xml.Events.BeforeDelete,
       drag: xml.Events.Drag,
       onActivate: xml.Events.OnActivate,
       onEditEnd: xml.Events.OnEditEnd,
       onCurrentRepresentationPeriodChange: xml.Events.OnCurrentRepresentationPeriodChange,
       dragCheck: xml.Events.DragCheck,
       insideDragCheck: xml.Events.InsideDragCheck,
    } : undefined,
  }
}

registerImport(ZElementType.enum.PlannerField, importPlannerFieldFromXML)