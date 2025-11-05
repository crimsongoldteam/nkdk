import { exportFormFieldToXML } from "../formField/exportToXML"
import { TPlannerFieldXML, TPlannerField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportPlannerFieldToXML = (data: TPlannerField | undefined): TPlannerFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
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
    Events: data.events ? {
       Selection: data.events.selection,
       PlannerActionClick: data.events.plannerActionClick,
       URLClick: data.events.uRLClick,
       WrappedTimeScaleHeaderClick: data.events.wrappedTimeScaleHeaderClick,
       DimensionItemClick: data.events.dimensionItemClick,
       TimeScaleItemClick: data.events.timeScaleItemClick,
       DragStart: data.events.dragStart,
       CommandGenerateProcessing: data.events.commandGenerateProcessing,
       DragEnd: data.events.dragEnd,
       BeforeStartQuickEdit: data.events.beforeStartQuickEdit,
       BeforeStartEdit: data.events.beforeStartEdit,
       BeforePrint: data.events.beforePrint,
       BeforeExpandDimensionItem: data.events.beforeExpandDimensionItem,
       BeforeCollapseDimensionItem: data.events.beforeCollapseDimensionItem,
       BeforeCreate: data.events.beforeCreate,
       BeforeDelete: data.events.beforeDelete,
       Drag: data.events.drag,
       OnActivate: data.events.onActivate,
       OnEditEnd: data.events.onEditEnd,
       OnCurrentRepresentationPeriodChange: data.events.onCurrentRepresentationPeriodChange,
       DragCheck: data.events.dragCheck,
       InsideDragCheck: data.events.insideDragCheck,
    } : undefined,
  }
}

registerExport(ZElementType.enum.PlannerField, exportPlannerFieldToXML)