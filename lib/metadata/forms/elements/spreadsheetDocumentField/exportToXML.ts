import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TSpreadSheetDocumentFieldXML, TSpreadSheetDocumentField } from "./types"

export const exportSpreadSheetDocumentFieldToXML = (data: TSpreadSheetDocumentField | undefined): TSpreadSheetDocumentFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    VerticalScrollBar: data.verticalScrollBar,
    Output: data.output,
    Height: data.height,
    HorizontalScrollBar: data.horizontalScrollBar,
    Protection: data.protection,
    UsedFileName: data.usedFileName,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    ShowGroups: data.showGroups,
    ShowHeaders: data.showHeaders,
    ShowRowAndColumnNames: data.showRowAndColumnNames,
    ShowCellNames: data.showCellNames,
    ShowGrid: data.showGrid,
    StatePresentation: data.statePresentation,
    EnableStartDrag: data.enableStartDrag,
    EnableDrag: data.enableDrag,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    Edit: data.edit,
    ViewScalingMode: data.viewScalingMode,
    SelectionShowMode: data.selectionShowMode,
    DrawingSelectionShowMode: data.drawingSelectionShowMode,
    PointerType: data.pointerType,
    BorderColor: exportColorToXML(data.borderColor),
    BlackAndWhiteView: data.blackAndWhiteView,
    Width: data.width,
  }
}