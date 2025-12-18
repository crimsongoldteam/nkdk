import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormFieldToXML } from "~/lib/metadata/forms/elements/formField/exportToXML"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldXML,
} from "~/lib/metadata/forms/elements/spreadSheetDocumentField/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportSpreadSheetDocumentFieldToXML = (
  data: SpreadSheetDocumentField | undefined,
  configurationSettings: ConfigurationSettings
): SpreadSheetDocumentFieldXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormFieldToXML(data, configurationSettings)!,

    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BlackAndWhiteView: data.blackAndWhiteView,
    BorderColor: exportColorToXML(data.borderColor, configurationSettings),
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
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
    Events: exportEventsToXML(data.events, configurationSettings),
  })
}

registerMetadata("ExportToXML", "SpreadSheetDocumentField", exportSpreadSheetDocumentFieldToXML)
