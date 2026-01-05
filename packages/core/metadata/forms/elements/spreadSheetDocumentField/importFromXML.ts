import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldXML,
} from "~/metadata/forms/elements/spreadSheetDocumentField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importSpreadSheetDocumentFieldFromXML = (
  context: ConfigurationContext,
  xml: SpreadSheetDocumentFieldXML | undefined
): SpreadSheetDocumentField | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormFieldFromXML(context, xml)!,
    elementType: FormElementType.SpreadSheetDocumentField,

    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    blackAndWhiteView: xml.BlackAndWhiteView,
    borderColor: importColorFromXML(context, xml.BorderColor),
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
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalScrollBar: xml.VerticalScrollBar,
    verticalStretch: xml.VerticalStretch,
    viewScalingMode: xml.ViewScalingMode,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "SpreadSheetDocumentField", importSpreadSheetDocumentFieldFromXML)
