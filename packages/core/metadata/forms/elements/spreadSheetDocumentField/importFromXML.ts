import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormFieldFromXML } from "~/metadata/forms/elements/formField/importFromXML"
import {
  SpreadSheetDocumentField,
  SpreadSheetDocumentFieldXML,
} from "~/metadata/forms/elements/spreadSheetDocumentField/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, FromXMLType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export function importSpreadSheetDocumentFieldFromXML<From extends SpreadSheetDocumentFieldXML | undefined>(
  context: ConfigurationContext,
  xml: From
): ImportExportReturn<From, FromXMLType<From>> {
  if (xml === undefined) return undefined

  const baseFields = importFormFieldFromXML(context, xml)
  if (!baseFields) return undefined

  const { elementType: _, ...restFields } = baseFields

  const result: SpreadSheetDocumentField = {
    elementType: FormElementType.SpreadSheetDocumentField,
    ...restFields,
  }

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  if (xml.BlackAndWhiteView !== undefined) result.blackAndWhiteView = xml.BlackAndWhiteView

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.DrawingSelectionShowMode !== undefined) result.drawingSelectionShowMode = xml.DrawingSelectionShowMode

  if (xml.Edit !== undefined) result.edit = xml.Edit

  if (xml.EnableDrag !== undefined) result.enableDrag = xml.EnableDrag

  if (xml.EnableStartDrag !== undefined) result.enableStartDrag = xml.EnableStartDrag

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalScrollBar !== undefined) result.horizontalScrollBar = xml.HorizontalScrollBar

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.Output !== undefined) result.output = xml.Output

  if (xml.PointerType !== undefined) result.pointerType = xml.PointerType

  if (xml.Protection !== undefined) result.protection = xml.Protection

  if (xml.SelectionShowMode !== undefined) result.selectionShowMode = xml.SelectionShowMode

  if (xml.ShowCellNames !== undefined) result.showCellNames = xml.ShowCellNames

  if (xml.ShowGrid !== undefined) result.showGrid = xml.ShowGrid

  if (xml.ShowGroups !== undefined) result.showGroups = xml.ShowGroups

  if (xml.ShowHeaders !== undefined) result.showHeaders = xml.ShowHeaders

  if (xml.ShowRowAndColumnNames !== undefined) result.showRowAndColumnNames = xml.ShowRowAndColumnNames

  if (xml.StatePresentation !== undefined) result.statePresentation = xml.StatePresentation

  if (xml.UsedFileName !== undefined) result.usedFileName = xml.UsedFileName

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalScrollBar !== undefined) result.verticalScrollBar = xml.VerticalScrollBar

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.ViewScalingMode !== undefined) result.viewScalingMode = xml.ViewScalingMode

  if (xml.Width !== undefined) result.width = xml.Width

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  return result as ImportExportReturn<From, FromXMLType<From>>
}

registerMetadata("ImportFromXML", "SpreadSheetDocumentField", importSpreadSheetDocumentFieldFromXML)
