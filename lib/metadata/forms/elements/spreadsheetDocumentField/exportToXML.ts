import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportSpreadSheetDocumentFieldToXML = (
  data: SpreadSheetDocumentField | undefined
): SpreadSheetDocumentFieldXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormFieldToXML(data)!,

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
    UserVisible: exportUserVisibleToXML(data.userVisible),
    Events: exportEventsToXML(data.events),
  }
}

registerExport(FormElementType.SpreadSheetDocumentField, exportSpreadSheetDocumentFieldToXML)
