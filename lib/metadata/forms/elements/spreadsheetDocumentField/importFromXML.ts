import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importFormFieldFromXML } from "~/lib/metadata/forms/elements/formField/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { FormElementType } from "../types"

export const importSpreadSheetDocumentFieldFromXML = (
  xml: SpreadSheetDocumentFieldXML | undefined
): SpreadSheetDocumentField | undefined => {
  if (!xml) return undefined

  return {
    ...importFormFieldFromXML(xml)!,
    elementType: FormElementType.SpreadSheetDocumentField,

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
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.SpreadSheetDocumentField, importSpreadSheetDocumentFieldFromXML)
