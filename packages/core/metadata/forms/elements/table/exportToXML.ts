import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportChildItemsToXML } from "~/metadata/forms/collections/childItems/exportToXML"
import { exportCommandSetToXML } from "~/metadata/forms/commandSet/exportToXML"
import { exportElementPropsToXML } from "~/metadata/forms/elements/baseElement/exportToXML"
import { exportContextMenuToXML } from "~/metadata/forms/elements/contextMenu/exportToXML"
import { Table, TableXML } from "~/metadata/forms/elements/table/types"
import { exportEventsToXML } from "~/metadata/forms/events/exportToXML"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ExportToXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { exportAutoCommandBarToXML } from "../autoCommandBar/exportToXML"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"
import { exportSearchControlAdditionToXML } from "../searchControlAddition/exportToXML"
import { exportSearchStringAdditionToXML } from "../searchStringAddition/exportToXML"
import { exportViewStatusAdditionToXML } from "../viewStatusAddition/exportToXML"

export function exportTableToXML<From extends Table | undefined>(
  context: ConfigurationContext,
  data: From
): ToXMLType<From> {
  if (data === undefined) return undefined as ToXMLType<From>

  const baseFields = exportElementPropsToXML(context, data)

  const autoCommandBar = exportAutoCommandBarToXML(context, data.autoCommandBar, data)

  const childItems = exportChildItemsToXML(context, data.childItems)

  const contextMenu = exportContextMenuToXML(context, data.contextMenu, data)

  const extendedTooltip = exportExtendedTooltipToXML(context, data.extendedTooltip, data)

  const searchControl = exportSearchControlAdditionToXML(context, data.searchControl, data)

  const searchStringRepresentation = exportSearchStringAdditionToXML(context, data.searchStringRepresentation, data)

  const viewStatusRepresentation = exportViewStatusAdditionToXML(context, data.viewStatusRepresentation, data)

  const result: TableXML = {
    AutoCommandBar: autoCommandBar,
    SearchControl: searchControl,
    SearchStringRepresentation: searchStringRepresentation,
    ViewStatusRepresentation: viewStatusRepresentation,
    ExtendedTooltip: extendedTooltip,
    ContextMenu: contextMenu,
    ...baseFields,
  }

  if (data.autoAddIncomplete !== undefined) result.AutoAddIncomplete = data.autoAddIncomplete

  if (data.autoInsertNewRow !== undefined) result.AutoInsertNewRow = data.autoInsertNewRow

  if (data.autoMarkIncomplete !== undefined) result.AutoMarkIncomplete = data.autoMarkIncomplete

  if (data.autoMaxHeight !== undefined) result.AutoMaxHeight = data.autoMaxHeight

  if (data.autoMaxHeightInTableRows !== undefined) result.AutoMaxHeightInTableRows = data.autoMaxHeightInTableRows

  if (data.autoMaxWidth !== undefined) result.AutoMaxWidth = data.autoMaxWidth

  const backColor = exportColorToXML(context, data.backColor)
  if (backColor !== undefined) result.BackColor = backColor

  if (data.behaviorOnHorizontalCompression !== undefined)
    result.BehaviorOnHorizontalCompression = data.behaviorOnHorizontalCompression

  const borderColor = exportColorToXML(context, data.borderColor)
  if (borderColor !== undefined) result.BorderColor = borderColor

  if (data.changeRowOrder !== undefined) result.ChangeRowOrder = data.changeRowOrder

  if (data.changeRowSet !== undefined) result.ChangeRowSet = data.changeRowSet

  if (childItems !== undefined) result.ChildItems = childItems

  if (data.choiceMode !== undefined) result.ChoiceMode = data.choiceMode

  if (data.commandBarLocation !== undefined) result.CommandBarLocation = data.commandBarLocation

  const commandSet = exportCommandSetToXML(context, data.commandSet)
  if (commandSet !== undefined) result.CommandSet = commandSet

  if (contextMenu !== undefined) result.ContextMenu = contextMenu

  if (data.currentRowUse !== undefined) result.CurrentRowUse = data.currentRowUse

  if (data.dataPath !== undefined) result.DataPath = data.dataPath

  if (data.defaultItem !== undefined) result.DefaultItem = data.defaultItem

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.enabled !== undefined) result.Enabled = data.enabled

  if (data.enableDrag !== undefined) result.EnableDrag = data.enableDrag

  if (data.enableStartDrag !== undefined) result.EnableStartDrag = data.enableStartDrag

  if (data.fileDragMode !== undefined) result.FileDragMode = data.fileDragMode

  const font = exportFontToXML(context, data.font)
  if (font !== undefined) result.Font = font

  if (data.footer !== undefined) result.Footer = data.footer

  if (data.footerHeight !== undefined) result.FooterHeight = data.footerHeight

  if (data.header !== undefined) result.Header = data.header

  if (data.headerHeight !== undefined) result.HeaderHeight = data.headerHeight

  if (data.height !== undefined) result.Height = data.height

  if (data.heightControlVariant !== undefined) result.HeightControlVariant = data.heightControlVariant

  if (data.heightInTableRows !== undefined) result.HeightInTableRows = data.heightInTableRows

  if (data.horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = data.horizontalAlignInGroup

  if (data.horizontalLines !== undefined) result.HorizontalLines = data.horizontalLines

  if (data.horizontalScrollBar !== undefined) result.HorizontalScrollBar = data.horizontalScrollBar

  if (data.horizontalStretch !== undefined) result.HorizontalStretch = data.horizontalStretch

  if (data.initialListView !== undefined) result.InitialListView = data.initialListView

  if (data.initialTreeView !== undefined) result.InitialTreeView = data.initialTreeView

  if (data.markIncomplete !== undefined) result.MarkIncomplete = data.markIncomplete

  if (data.maxHeight !== undefined) result.MaxHeight = data.maxHeight

  if (data.maxHeightInTableRows !== undefined) result.MaxHeightInTableRows = data.maxHeightInTableRows

  if (data.maxWidth !== undefined) result.MaxWidth = data.maxWidth

  if (data.multipleChoice !== undefined) result.MultipleChoice = data.multipleChoice

  if (data.output !== undefined) result.Output = data.output

  if (data.readOnly !== undefined) result.ReadOnly = data.readOnly

  if (data.refreshRequest !== undefined) result.RefreshRequest = data.refreshRequest

  if (data.representation !== undefined) result.Representation = data.representation

  if (data.rowInputMode !== undefined) result.RowInputMode = data.rowInputMode

  if (data.rowPictureDataPath !== undefined) result.RowPictureDataPath = data.rowPictureDataPath

  if (data.rowSelectionMode !== undefined) result.RowSelectionMode = data.rowSelectionMode

  if (data.rowsPicture !== undefined) result.RowsPicture = data.rowsPicture

  if (data.searchControlLocation !== undefined) result.SearchControlLocation = data.searchControlLocation

  if (data.searchOnInput !== undefined) result.SearchOnInput = data.searchOnInput

  if (data.searchStringLocation !== undefined) result.SearchStringLocation = data.searchStringLocation

  if (data.selectionMode !== undefined) result.SelectionMode = data.selectionMode

  if (data.shortcut !== undefined) result.Shortcut = data.shortcut

  if (data.skipOnInput !== undefined) result.SkipOnInput = data.skipOnInput

  const textColor = exportColorToXML(context, data.textColor)
  if (textColor !== undefined) result.TextColor = textColor

  const title = exportI8nTextToXML(context, data.title)
  if (title !== undefined) result.Title = title

  const titleFont = exportFontToXML(context, data.titleFont)
  if (titleFont !== undefined) result.TitleFont = titleFont

  if (data.titleHeight !== undefined) result.TitleHeight = data.titleHeight

  if (data.titleLocation !== undefined) result.TitleLocation = data.titleLocation

  const titleTextColor = exportColorToXML(context, data.titleTextColor)
  if (titleTextColor !== undefined) result.TitleTextColor = titleTextColor

  const toolTip = exportI8nTextToXML(context, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  if (data.useAlternationRowColor !== undefined) result.UseAlternationRowColor = data.useAlternationRowColor

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalAlignInGroup !== undefined) result.VerticalAlignInGroup = data.verticalAlignInGroup

  if (data.verticalLines !== undefined) result.VerticalLines = data.verticalLines

  if (data.verticalScrollBar !== undefined) result.VerticalScrollBar = data.verticalScrollBar

  if (data.verticalStretch !== undefined) result.VerticalStretch = data.verticalStretch

  if (data.viewStatusLocation !== undefined) result.ViewStatusLocation = data.viewStatusLocation

  if (data.visible !== undefined) result.Visible = data.visible

  if (data.width !== undefined) result.Width = data.width

  const events = exportEventsToXML(context, data.events)
  if (events !== undefined) result.Events = events

  return sortObject(result) as ToXMLType<From>
}

registerMetadata("ExportToXML", "Table", exportTableToXML as ExportToXMLFn)
