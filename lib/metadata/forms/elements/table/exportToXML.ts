import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { exportChildItemsToXML } from "../childItems/exportToXML"
import { exportFormItemAdditionToXML } from "../formItemAddition/exportToXML"
import { exportBaseElementToXML } from "../baseElement/exportToXML"
import { TTableXML, TTable } from "./types"

export const exportTableToXML = (data: TTable | undefined): TTableXML | undefined => {
  if (!data) return undefined

  const base = exportBaseElementToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    AutoAddIncomplete: data.autoAddIncomplete,
    AutoInsertNewRow: data.autoInsertNewRow,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxHeightInTableRows: data.autoMaxHeightInTableRows,
    AutoMaxWidth: data.autoMaxWidth,
    AutoMarkIncomplete: data.autoMarkIncomplete,
    DefaultItem: data.defaultItem,
    DisplayImportance: data.displayImportance,
    HeightControlVariant: data.heightControlVariant,
    VerticalScrollBar: data.verticalScrollBar,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalLines: data.verticalLines,
    Visible: data.visible,
    Output: data.output,
    Height: data.height,
    HeightInTableRows: data.heightInTableRows,
    TitleHeight: data.titleHeight,
    FooterHeight: data.footerHeight,
    HeaderHeight: data.headerHeight,
    HorizontalScrollBar: data.horizontalScrollBar,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    HorizontalLines: data.horizontalLines,
    Enabled: data.enabled,
    Title: exportI8nTextToXML(data.title),
    RefreshRequest: data.refreshRequest,
    ChangeRowOrder: data.changeRowOrder,
    ChangeRowSet: data.changeRowSet,
    CurrentRowUse: data.currentRowUse,
    RowsPicture: data.rowsPicture,
    CommandBar: exportCommandBarToXML(data.commandBar),
    ContextMenu: exportCommandBarToXML(data.contextMenu),
    MaxHeight: data.maxHeight,
    MaxHeightInTableRows: data.maxHeightInTableRows,
    MaxWidth: data.maxWidth,
    MultipleChoice: data.multipleChoice,
    InitialTreeView: data.initialTreeView,
    InitialListView: data.initialListView,
    MarkIncomplete: data.markIncomplete,
    Representation: data.representation,
    ToolTipRepresentation: data.toolTipRepresentation,
    ViewStatusRepresentation: exportFormItemAdditionToXML(data.viewStatusRepresentation),
    SearchStringRepresentation: exportFormItemAdditionToXML(data.searchStringRepresentation),
    BehaviorOnHorizontalCompression: data.behaviorOnHorizontalCompression,
    Footer: data.footer,
    ToolTip: exportI8nTextToXML(data.toolTip),
    ChildItems: exportChildItemsToXML(data.childItems),
    SearchOnInput: data.searchOnInput,
    TitleLocation: data.titleLocation,
    CommandBarLocation: data.commandBarLocation,
    ViewStatusLocation: data.viewStatusLocation,
    SearchStringLocation: data.searchStringLocation,
    SearchControlLocation: data.searchControlLocation,
    SkipOnInput: data.skipOnInput,
    DataPath: data.dataPath,
    RowPictureDataPath: data.rowPictureDataPath,
    EnableStartDrag: data.enableStartDrag,
    EnableDrag: data.enableDrag,
    VerticalStretch: data.verticalStretch,
    HorizontalStretch: data.horizontalStretch,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    RowInputMode: data.rowInputMode,
    ChoiceMode: data.choiceMode,
    SelectionMode: data.selectionMode,
    RowSelectionMode: data.rowSelectionMode,
    Shortcut: data.shortcut,
    FileDragMode: data.fileDragMode,
    ReadOnly: data.readOnly,
    SearchControl: exportFormItemAdditionToXML(data.searchControl),
    BorderColor: exportColorToXML(data.borderColor),
    TextColor: exportColorToXML(data.textColor),
    TitleTextColor: exportColorToXML(data.titleTextColor),
    BackColor: exportColorToXML(data.backColor),
    UseAlternationRowColor: data.useAlternationRowColor,
    Header: data.header,
    Width: data.width,
    Font: exportFontToXML(data.font),
    TitleFont: exportFontToXML(data.titleFont),
  }
}