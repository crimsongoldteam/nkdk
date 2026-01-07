import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldXML,
} from "~/metadata/forms/elements/spreadSheetDocumentField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportSpreadSheetDocumentFieldToXML = (
  context: ConfigurationContext,
  data: SpreadSheetDocumentField | undefined
): SpreadSheetDocumentFieldXML | undefined => {
  if (!data) return undefined

  return {
    const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BlackAndWhiteView: data.blackAndWhiteView,
    BorderColor: exportColorToXML(context, data.borderColor),
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
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalScrollBar: data.verticalScrollBar,
    VerticalStretch: data.verticalStretch,
    ViewScalingMode: data.viewScalingMode,
    Width: data.width,
    Events: exportEventsToXML(context, data.events),  }
}

registerMetadata("ExportToXML", "SpreadSheetDocumentField", exportSpreadSheetDocumentFieldToXML)
