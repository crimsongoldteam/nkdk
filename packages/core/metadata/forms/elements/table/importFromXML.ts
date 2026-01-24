import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importCommandSetFromXML } from "~/metadata/forms/commandSet/importFromXML"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { importContextMenuFromXML } from "~/metadata/forms/elements/contextMenu/importFromXML"
import { importExtendedTooltipFromXML } from "~/metadata/forms/elements/extendedTooltip/importFromXML"
import { Table } from "~/metadata/forms/elements/table/types"
import { importEventsFromXML } from "~/metadata/forms/events/importFromXML"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType, ImportFromXMLFn, ToXMLType } from "~/metadata/metadataFactory/types"
import { importChildItemsFromXML } from "../../collections/childItems/importFromXML"
import { importAutoCommandBarFromXML } from "../autoCommandBar/importFromXML"
import { importSingleSearchControlAdditionFromXML } from "../searchControlAddition/importFromXML"
import { importSingleSearchStringAdditionFromXML } from "../searchStringAddition/importFromXML"
import { importViewStatusAdditionFromXML } from "../viewStatusAddition/importFromXML"

export function importTableFromXML<To extends Table | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To
  const baseFields = importBaseElementFromXML(context, xml)

  const result: Table = {
    elementType: FormElementType.Table,
    ...baseFields,
    childItems: [],
  }

  if (xml.AdditionalCreateParameters !== undefined) result.additionalCreateParameters = xml.AdditionalCreateParameters

  if (xml.AllowGettingCurrentRowURL !== undefined) result.allowGettingCurrentRowURL = xml.AllowGettingCurrentRowURL

  if (xml.AllowRootChoice !== undefined) result.allowRootChoice = xml.AllowRootChoice

  if (xml.AutoAddIncomplete !== undefined) result.autoAddIncomplete = xml.AutoAddIncomplete

  const autoCommandBar = importAutoCommandBarFromXML(context, xml.AutoCommandBar)
  if (autoCommandBar !== undefined) result.autoCommandBar = autoCommandBar

  if (xml.AutoInsertNewRow !== undefined) result.autoInsertNewRow = xml.AutoInsertNewRow

  if (xml.AutoMarkIncomplete !== undefined) result.autoMarkIncomplete = xml.AutoMarkIncomplete

  if (xml.AutoMaxHeight !== undefined) result.autoMaxHeight = xml.AutoMaxHeight

  if (xml.AutoMaxHeightInTableRows !== undefined) result.autoMaxHeightInTableRows = xml.AutoMaxHeightInTableRows

  if (xml.AutoMaxWidth !== undefined) result.autoMaxWidth = xml.AutoMaxWidth

  if (xml.AutoRefresh !== undefined) result.autoRefresh = xml.AutoRefresh

  if (xml.AutoRefreshPeriod !== undefined) result.autoRefreshPeriod = xml.AutoRefreshPeriod

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  if (xml.BehaviorOnHorizontalCompression !== undefined)
    result.behaviorOnHorizontalCompression = xml.BehaviorOnHorizontalCompression

  const borderColor = importColorFromXML(context, xml.BorderColor)
  if (borderColor !== undefined) result.borderColor = borderColor

  if (xml.ChangeRowOrder !== undefined) result.changeRowOrder = xml.ChangeRowOrder

  if (xml.ChangeRowSet !== undefined) result.changeRowSet = xml.ChangeRowSet

  result.childItems = importChildItemsFromXML(context, xml.ChildItems)

  if (xml.ChoiceFoldersAndItems !== undefined) result.choiceFoldersAndItems = xml.ChoiceFoldersAndItems

  if (xml.ChoiceMode !== undefined) result.choiceMode = xml.ChoiceMode

  if (xml.CommandBarLocation !== undefined) result.commandBarLocation = xml.CommandBarLocation

  const commandSet = importCommandSetFromXML(context, xml.CommandSet)
  if (commandSet !== undefined) result.commandSet = commandSet

  const contextMenu = importContextMenuFromXML(context, xml.ContextMenu)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (xml.CurrentRowUse !== undefined) result.currentRowUse = xml.CurrentRowUse

  if (xml.DataPath !== undefined) result.dataPath = xml.DataPath

  if (xml.DefaultItem !== undefined) result.defaultItem = xml.DefaultItem

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.EnableDrag !== undefined) result.enableDrag = xml.EnableDrag

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  if (xml.EnableStartDrag !== undefined) result.enableStartDrag = xml.EnableStartDrag

  const events = importEventsFromXML(context, xml.Events)
  if (events !== undefined) result.events = events

  const extendedTooltip = importExtendedTooltipFromXML(context, xml.ExtendedTooltip)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (xml.FileDragMode !== undefined) result.fileDragMode = xml.FileDragMode

  const font = importFontFromXML(context, xml.Font)
  if (font !== undefined) result.font = font

  if (xml.Footer !== undefined) result.footer = xml.Footer

  if (xml.FooterHeight !== undefined) result.footerHeight = xml.FooterHeight

  if (xml.Header !== undefined) result.header = xml.Header

  if (xml.HeaderHeight !== undefined) result.headerHeight = xml.HeaderHeight

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HeightControlVariant !== undefined) result.heightControlVariant = xml.HeightControlVariant

  if (xml.HeightInTableRows !== undefined) result.heightInTableRows = xml.HeightInTableRows

  if (xml.HorizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = xml.HorizontalAlignInGroup

  if (xml.HorizontalLines !== undefined) result.horizontalLines = xml.HorizontalLines

  if (xml.HorizontalScrollBar !== undefined) result.horizontalScrollBar = xml.HorizontalScrollBar

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.InitialListView !== undefined) result.initialListView = xml.InitialListView

  if (xml.InitialTreeView !== undefined) result.initialTreeView = xml.InitialTreeView

  if (xml.MarkIncomplete !== undefined) result.markIncomplete = xml.MarkIncomplete

  if (xml.MaxHeight !== undefined) result.maxHeight = xml.MaxHeight

  if (xml.MaxHeightInTableRows !== undefined) result.maxHeightInTableRows = xml.MaxHeightInTableRows

  if (xml.MaxWidth !== undefined) result.maxWidth = xml.MaxWidth

  if (xml.MultipleChoice !== undefined) result.multipleChoice = xml.MultipleChoice

  if (xml.Output !== undefined) result.output = xml.Output

  if (xml.ReadOnly !== undefined) result.readOnly = xml.ReadOnly

  if (xml.RefreshRequest !== undefined) result.refreshRequest = xml.RefreshRequest

  if (xml.Representation !== undefined) result.representation = xml.Representation

  if (xml.RestoreCurrentRow !== undefined) result.restoreCurrentRow = xml.RestoreCurrentRow

  if (xml.RowInputMode !== undefined) result.rowInputMode = xml.RowInputMode

  if (xml.RowPictureDataPath !== undefined) result.rowPictureDataPath = xml.RowPictureDataPath

  if (xml.RowSelectionMode !== undefined) result.rowSelectionMode = xml.RowSelectionMode

  if (xml.RowsPicture !== undefined) result.rowsPicture = xml.RowsPicture

  const searchControl = importSingleSearchControlAdditionFromXML(context, xml.SearchControlAddition)
  if (searchControl !== undefined) result.searchControl = searchControl

  if (xml.SearchControlLocation !== undefined) result.searchControlLocation = xml.SearchControlLocation

  if (xml.SearchOnInput !== undefined) result.searchOnInput = xml.SearchOnInput

  const searchStringAddition = importSingleSearchStringAdditionFromXML(context, xml.SearchStringAddition)
  if (searchStringAddition !== undefined) result.searchStringAddition = searchStringAddition

  if (xml.SearchStringLocation !== undefined) result.searchStringLocation = xml.SearchStringLocation

  if (xml.SelectionMode !== undefined) result.selectionMode = xml.SelectionMode

  if (xml.Shortcut !== undefined) result.shortcut = xml.Shortcut

  if (xml.ShowRoot !== undefined) result.showRoot = xml.ShowRoot

  if (xml.SkipOnInput !== undefined) result.skipOnInput = xml.SkipOnInput

  const textColor = importColorFromXML(context, xml.TextColor)
  if (textColor !== undefined) result.textColor = textColor

  const title = importI8nTextFromXML(context, xml.Title)
  if (title !== undefined) result.title = title

  const titleFont = importFontFromXML(context, xml.TitleFont)
  if (titleFont !== undefined) result.titleFont = titleFont

  if (xml.TitleHeight !== undefined) result.titleHeight = xml.TitleHeight

  if (xml.TitleLocation !== undefined) result.titleLocation = xml.TitleLocation

  const titleTextColor = importColorFromXML(context, xml.TitleTextColor)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const toolTip = importI8nTextFromXML(context, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  if (xml.UpdateOnDataChange !== undefined) result.updateOnDataChange = xml.UpdateOnDataChange

  if (xml.UseAlternationRowColor !== undefined) result.useAlternationRowColor = xml.UseAlternationRowColor

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlignInGroup !== undefined) result.verticalAlignInGroup = xml.VerticalAlignInGroup

  if (xml.VerticalLines !== undefined) result.verticalLines = xml.VerticalLines

  if (xml.VerticalScrollBar !== undefined) result.verticalScrollBar = xml.VerticalScrollBar

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  const viewStatusAddition = importViewStatusAdditionFromXML(context, xml.ViewStatusAddition)
  if (viewStatusAddition !== undefined) result.viewStatusAddition = viewStatusAddition

  if (xml.ViewStatusLocation !== undefined) result.viewStatusLocation = xml.ViewStatusLocation

  if (xml.Visible !== undefined) result.visible = xml.Visible

  if (xml.Width !== undefined) result.width = xml.Width

  if (xml.UserSettingsGroup !== undefined) result.userSettingsGroup = xml.UserSettingsGroup

  return result as To
}

registerMetadata("ImportFromXML", "Table", importTableFromXML as ImportFromXMLFn)
