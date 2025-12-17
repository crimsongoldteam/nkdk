import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportCommandSetToXML } from "~/lib/metadata/forms/commandSet/exportToXML"
import { exportBaseElementToXML } from "~/lib/metadata/forms/elements/baseElement/exportToXML"
import { exportChildItemsToXML } from "~/lib/metadata/forms/elements/childItems/exportToXML"
import { exportCommandBarToXML } from "~/lib/metadata/forms/elements/commandBar/exportToXML"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { exportFormItemAdditionToXML } from "~/lib/metadata/forms/elements/formItemAddition/exportToXML"
import { exportSearchControlAdditionToXML } from "~/lib/metadata/forms/elements/searchControlAddition/exportToXML"
import { exportSearchStringAdditionToXML } from "~/lib/metadata/forms/elements/searchStringAddition/exportToXML"
import { Table, TableXML } from "~/lib/metadata/forms/elements/table/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportViewStatusAdditionToXML } from "~/lib/metadata/forms/elements/viewStatusAddition/exportToXML"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"

export const exportTableToXML = (data: Table | undefined): TableXML | undefined => {
  if (!data) return undefined

  return {
    ...exportBaseElementToXML(data)!,

    AutoAddIncomplete: data.autoAddIncomplete,
    AutoCommandBar: exportCommandBarToXML(data.autoCommandBar),
    AutoInsertNewRow: data.autoInsertNewRow,
    AutoMarkIncomplete: data.autoMarkIncomplete,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxHeightInTableRows: data.autoMaxHeightInTableRows,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(data.backColor),
    BehaviorOnHorizontalCompression: data.behaviorOnHorizontalCompression,
    BorderColor: exportColorToXML(data.borderColor),
    ChangeRowOrder: data.changeRowOrder,
    ChangeRowSet: data.changeRowSet,
    ChoiceMode: data.choiceMode,
    CommandBar: exportCommandBarToXML(data.commandBar),
    CommandBarLocation: data.commandBarLocation,
    CommandSet: exportCommandSetToXML(data.commandSet),
    ContextMenu: exportCommandBarToXML(data.contextMenu),
    CurrentRowUse: data.currentRowUse,
    DataPath: data.dataPath,
    DefaultItem: data.defaultItem,
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    FileDragMode: data.fileDragMode,
    Font: exportFontToXML(data.font),
    Footer: data.footer,
    FooterHeight: data.footerHeight,
    Header: data.header,
    HeaderHeight: data.headerHeight,
    Height: data.height,
    HeightControlVariant: data.heightControlVariant,
    HeightInTableRows: data.heightInTableRows,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    HorizontalLines: data.horizontalLines,
    HorizontalScrollBar: data.horizontalScrollBar,
    HorizontalStretch: data.horizontalStretch,
    InitialListView: data.initialListView,
    InitialTreeView: data.initialTreeView,
    MarkIncomplete: data.markIncomplete,
    MaxHeight: data.maxHeight,
    MaxHeightInTableRows: data.maxHeightInTableRows,
    MaxWidth: data.maxWidth,
    MultipleChoice: data.multipleChoice,
    Output: data.output,
    ReadOnly: data.readOnly,
    RefreshRequest: data.refreshRequest,
    Representation: data.representation,
    RowInputMode: data.rowInputMode,
    RowPictureDataPath: data.rowPictureDataPath,
    RowSelectionMode: data.rowSelectionMode,
    RowsPicture: data.rowsPicture,
    SearchControl: exportFormItemAdditionToXML(data.searchControl),
    SearchControlAddition: exportSearchControlAdditionToXML(data.searchControlAddition),
    SearchControlLocation: data.searchControlLocation,
    SearchOnInput: data.searchOnInput,
    SearchStringAddition: exportSearchStringAdditionToXML(data.searchStringAddition),
    SearchStringLocation: data.searchStringLocation,
    SearchStringRepresentation: exportFormItemAdditionToXML(data.searchStringRepresentation),
    SelectionMode: data.selectionMode,
    Shortcut: data.shortcut,
    SkipOnInput: data.skipOnInput,
    TextColor: exportColorToXML(data.textColor),
    Title: exportI8nTextToXML(data.title),
    TitleFont: exportFontToXML(data.titleFont),
    TitleHeight: data.titleHeight,
    TitleLocation: data.titleLocation,
    TitleTextColor: exportColorToXML(data.titleTextColor),
    ToolTip: exportI8nTextToXML(data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    UseAlternationRowColor: data.useAlternationRowColor,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalLines: data.verticalLines,
    VerticalScrollBar: data.verticalScrollBar,
    VerticalStretch: data.verticalStretch,
    ViewStatusAddition: exportViewStatusAdditionToXML(data.viewStatusAddition),
    ViewStatusLocation: data.viewStatusLocation,
    ViewStatusRepresentation: exportFormItemAdditionToXML(data.viewStatusRepresentation),
    Visible: data.visible,
    Width: data.width,
    ChildItems: exportChildItemsToXML(data.childItems),
    UserVisible: exportUserVisibleToXML(data.userVisible),
    Events: exportEventsToXML(data.events),
  }
}

registerExport(FormElementType.Table, exportTableToXML)
