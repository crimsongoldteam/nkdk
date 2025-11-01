import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TSpreadSheetDocumentFieldXML, TSpreadSheetDocumentField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importSpreadSheetDocumentFieldFromXML = (xml: TSpreadSheetDocumentFieldXML | undefined): TSpreadSheetDocumentField | undefined => {
  if (!xml) return undefined

  const base = importFormFieldFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.SpreadSheetDocumentField,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    blackAndWhiteView: xml.BlackAndWhiteView,
    borderColor: importColorFromXML(xml.BorderColor),
    drawingSelectionShowMode: xml.DrawingSelectionShowMode,
    edit: xml.Edit,
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    height: xml.Height,
    horizontalScrollBar: xml.HorizontalScrollBar,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    pointerType: xml.PointerType,
    protection: xml.Protection,
    selectionShowMode: xml.SelectionShowMode,
    showCellNames: xml.ShowCellNames,
    showGrid: xml.ShowGrid,
    showGroups: xml.ShowGroups,
    showHeaders: xml.ShowHeaders,
    showRowAndColumnNames: xml.ShowRowAndColumnNames,
    statePresentation: xml.StatePresentation,
    usedFileName: xml.UsedFileName,
    verticalScrollBar: xml.VerticalScrollBar,
    verticalStretch: xml.VerticalStretch,
    viewScalingMode: xml.ViewScalingMode,
    width: xml.Width,
  }
}

registerImport(ZElementType.enum.SpreadSheetDocumentField, importSpreadSheetDocumentFieldFromXML)