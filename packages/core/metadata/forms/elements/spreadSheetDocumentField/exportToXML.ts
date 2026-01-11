import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormFieldToXML } from "~/metadata/forms/elements/formField/exportToXML"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldXML,
} from "~/metadata/forms/elements/spreadSheetDocumentField/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportSpreadSheetDocumentFieldToXML = (
  context: ConfigurationContext,
  data: SpreadSheetDocumentField | undefined
): SpreadSheetDocumentFieldXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormFieldToXML(context, data)
  if (!baseFields) return undefined

  const result: SpreadSheetDocumentFieldXML = {
    ...baseFields,
  }

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  if (data.blackAndWhiteView !== undefined) result.BlackAndWhiteView = data.blackAndWhiteView

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (data.drawingSelectionShowMode !== undefined) result.DrawingSelectionShowMode = data.drawingSelectionShowMode

  if (data.edit !== undefined) result.Edit = data.edit

  if (data.enableDrag !== undefined) result.EnableDrag = data.enableDrag

  if (data.enableStartDrag !== undefined) result.EnableStartDrag = data.enableStartDrag

  if (data.height !== undefined) result.Height = data.height

  if (data.horizontalScrollBar !== undefined) result.HorizontalScrollBar = data.horizontalScrollBar

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.output !== undefined) result.Output = data.output

  if (data.pointerType !== undefined) result.PointerType = data.pointerType

  if (data.protection !== undefined) result.Protection = data.protection

  if (data.selectionShowMode !== undefined) result.SelectionShowMode = data.selectionShowMode

  if (data.showCellNames !== undefined) result.ShowCellNames = data.showCellNames

  if (data.showGrid !== undefined) result.ShowGrid = data.showGrid

  if (data.showGroups !== undefined) result.ShowGroups = data.showGroups

  if (data.showHeaders !== undefined) result.ShowHeaders = data.showHeaders

  if (data.showRowAndColumnNames !== undefined) result.ShowRowAndColumnNames = data.showRowAndColumnNames

  if (data.statePresentation !== undefined) result.StatePresentation = data.statePresentation

  if (data.usedFileName !== undefined) result.UsedFileName = data.usedFileName

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalScrollBar !== undefined) result.VerticalScrollBar = data.verticalScrollBar

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.viewScalingMode !== undefined) result.ViewScalingMode = data.viewScalingMode

  if (data.width !== undefined) result.Width = data.width

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result)
}

registerMetadata("ExportToXML", "SpreadSheetDocumentField", exportSpreadSheetDocumentFieldToXML)
