import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TSpreadSheetDocumentFieldXML, TSpreadSheetDocumentField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER = ["DataPath", "Visible", "UserVisible", "Enabled", "ReadOnly", "SkipOnInput", "Title", "TitleTextColor", "TitleFont", "TitleLocation", "TitleHeight", "ToolTip", "ToolTipRepresentation", "WarningOnEditRepresentation", "WarningOnEdit", "Shortcut", "HorizontalAlign", "GroupHorizontalAlign", "GroupVerticalAlign", "OnMainServerUnavalableBehavior", "AutoMaxWidth", "MaxWidth", "AutoMaxHeight", "HorizontalStretch", "VerticalStretch", "ShowGrid", "ShowHeaders", "BlackAndWhiteView", "Protection", "DrawingSelectionShowMode", "PointerType", "Output", "Edit", "ShowGroups", "EnableStartDrag", "EnableDrag", "ShowCellNames", "ShowRowAndColumnNames", "ViewScalingMode", "ContextMenu", "ExtendedTooltip", "Events"]

export const exportSpreadSheetDocumentFieldToXML = (data: TSpreadSheetDocumentField | undefined): TSpreadSheetDocumentFieldXML | undefined => {
  if (!data) return undefined

  const base = exportFormFieldToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TSpreadSheetDocumentFieldXML>( {
    ...base,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BlackAndWhiteView: data.blackAndWhiteView,
    BorderColor: exportColorToXML(data.borderColor),
    DrawingSelectionShowMode: data.drawingSelectionShowMode,
    Edit: data.edit,
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    Height: data.height,
    HorizontalScrollBar: data.horizontalScrollBar,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    Output: data.output,
    PointerType: data.pointerType,
    Protection: data.protection,
    SelectionShowMode: data.selectionShowMode,
    ShowCellNames: data.showCellNames,
    ShowGrid: data.showGrid,
    ShowGroups: data.showGroups,
    ShowHeaders: data.showHeaders,
    ShowRowAndColumnNames: data.showRowAndColumnNames,
    StatePresentation: data.statePresentation,
    UsedFileName: data.usedFileName,
    VerticalScrollBar: data.verticalScrollBar,
    VerticalStretch: data.verticalStretch,
    ViewScalingMode: data.viewScalingMode,
    Width: data.width,
  }, ORDER)
}

registerExport(ZElementType.enum.SpreadSheetDocumentField, exportSpreadSheetDocumentFieldToXML)