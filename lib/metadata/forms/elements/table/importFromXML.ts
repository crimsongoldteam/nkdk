import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { importSearchControlAdditionFromXML } from "~/lib/metadata/forms/elements/searchControlAddition/importFromXML"
import { importSearchStringAdditionFromXML } from "~/lib/metadata/forms/elements/searchStringAddition/importFromXML"
import { importViewStatusAdditionFromXML } from "~/lib/metadata/forms/elements/viewStatusAddition/importFromXML"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importBaseElementFromXML } from "../baseElement/importFromXML"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importCommandBarFromXML } from "../commandBar/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importFormItemAdditionFromXML } from "../formItemAddition/importFromXML"
import { FormElementType } from "../types"
import { Table, TableXML } from "./types"

export const importTableFromXML = (xml: TableXML | undefined): Table | undefined => {
  if (!xml) return undefined

  return {
    ...importBaseElementFromXML(xml)!,
    elementType: FormElementType.Table,

    autoAddIncomplete: xml.AutoAddIncomplete,
    autoCommandBar: importCommandBarFromXML(xml.AutoCommandBar),
    autoInsertNewRow: xml.AutoInsertNewRow,
    autoMarkIncomplete: xml.AutoMarkIncomplete,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxHeightInTableRows: xml.AutoMaxHeightInTableRows,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(xml.BackColor),
    behaviorOnHorizontalCompression: xml.BehaviorOnHorizontalCompression,
    borderColor: importColorFromXML(xml.BorderColor),
    changeRowOrder: xml.ChangeRowOrder,
    changeRowSet: xml.ChangeRowSet,
    choiceMode: xml.ChoiceMode,
    commandBar: importCommandBarFromXML(xml.CommandBar),
    commandBarLocation: xml.CommandBarLocation,
    commandSet: xml.CommandSet,
    contextMenu: importCommandBarFromXML(xml.ContextMenu),
    currentRowUse: xml.CurrentRowUse,
    dataPath: xml.DataPath,
    defaultItem: xml.DefaultItem,
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    fileDragMode: xml.FileDragMode,
    font: importFontFromXML(xml.Font),
    footer: xml.Footer,
    footerHeight: xml.FooterHeight,
    header: xml.Header,
    headerHeight: xml.HeaderHeight,
    height: xml.Height,
    heightControlVariant: xml.HeightControlVariant,
    heightInTableRows: xml.HeightInTableRows,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalLines: xml.HorizontalLines,
    horizontalScrollBar: xml.HorizontalScrollBar,
    horizontalStretch: xml.HorizontalStretch,
    initialListView: xml.InitialListView,
    initialTreeView: xml.InitialTreeView,
    markIncomplete: xml.MarkIncomplete,
    maxHeight: xml.MaxHeight,
    maxHeightInTableRows: xml.MaxHeightInTableRows,
    maxWidth: xml.MaxWidth,
    multipleChoice: xml.MultipleChoice,
    output: xml.Output,
    readOnly: xml.ReadOnly,
    refreshRequest: xml.RefreshRequest,
    representation: xml.Representation,
    rowInputMode: xml.RowInputMode,
    rowPictureDataPath: xml.RowPictureDataPath,
    rowSelectionMode: xml.RowSelectionMode,
    rowsPicture: xml.RowsPicture,
    searchControl: importFormItemAdditionFromXML(xml.SearchControl),
    searchControlAddition: importSearchControlAdditionFromXML(xml.SearchControlAddition),
    searchControlLocation: xml.SearchControlLocation,
    searchOnInput: xml.SearchOnInput,
    searchStringAddition: importSearchStringAdditionFromXML(xml.SearchStringAddition),
    searchStringLocation: xml.SearchStringLocation,
    searchStringRepresentation: importFormItemAdditionFromXML(xml.SearchStringRepresentation),
    selectionMode: xml.SelectionMode,
    shortcut: xml.Shortcut,
    skipOnInput: xml.SkipOnInput,
    textColor: importColorFromXML(xml.TextColor),
    title: importI8nTextFromXML(xml.Title),
    titleFont: importFontFromXML(xml.TitleFont),
    titleHeight: xml.TitleHeight,
    titleLocation: xml.TitleLocation,
    titleTextColor: importColorFromXML(xml.TitleTextColor),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    useAlternationRowColor: xml.UseAlternationRowColor,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalLines: xml.VerticalLines,
    verticalScrollBar: xml.VerticalScrollBar,
    verticalStretch: xml.VerticalStretch,
    viewStatusAddition: importViewStatusAdditionFromXML(xml.ViewStatusAddition),
    viewStatusLocation: xml.ViewStatusLocation,
    viewStatusRepresentation: importFormItemAdditionFromXML(xml.ViewStatusRepresentation),
    visible: xml.Visible,
    width: xml.Width,
    childItems: importChildItemsFromXML(xml.ChildItems),
    events: importEventsFromXML(xml.Events),
  }
}

registerImport(FormElementType.Table, importTableFromXML)
