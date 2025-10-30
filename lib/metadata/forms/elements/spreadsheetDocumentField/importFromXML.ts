import importColorFromXML from "~/lib/metadata/color/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TSpreadsheetDocumentFieldXML, TSpreadsheetDocumentField } from "./types"


export const importSpreadsheetDocumentFieldFromXML = (xml: TSpreadsheetDocumentFieldXML | undefined): TSpreadsheetDocumentField | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     autoMaxHeight: xml.AutoMaxHeight,
     autoMaxWidth: xml.AutoMaxWidth,
     verticalScrollBar: xml.VerticalScrollBar,
     output: xml.Output,
     height: xml.Height,
     horizontalScrollBar: xml.HorizontalScrollBar,
     protection: xml.Protection,
     usedFileName: xml.UsedFileName,
     maxHeight: xml.MaxHeight,
     maxWidth: xml.MaxWidth,
     showGroups: xml.ShowGroups,
     showHeaders: xml.ShowHeaders,
     showRowAndColumnNames: xml.ShowRowAndColumnNames,
     showCellNames: xml.ShowCellNames,
     showGrid: xml.ShowGrid,
     statePresentation: xml.StatePresentation,
     enableStartDrag: xml.EnableStartDrag,
     enableDrag: xml.EnableDrag,
     verticalStretch: xml.VerticalStretch,
     horizontalStretch: xml.HorizontalStretch,
     edit: xml.Edit,
     viewScalingMode: xml.ViewScalingMode,
     selectionShowMode: xml.SelectionShowMode,
     drawingSelectionShowMode: xml.DrawingSelectionShowMode,
     currentArea: xml.CurrentArea,
     pointerType: xml.PointerType,
     borderColor: importColorFromXML(xml.BorderColor),
     blackAndWhiteView: xml.BlackAndWhiteView,
     width: xml.Width,
  }
}