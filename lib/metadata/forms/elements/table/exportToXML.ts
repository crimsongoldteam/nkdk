import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportCommandSetToXML } from "~/lib/metadata/forms/commandSet/exportToXML"
import { exportBaseElementToXML } from "~/lib/metadata/forms/elements/baseElement/exportToXML"
import { exportChildItemsToXML } from "~/lib/metadata/forms/elements/childItems/exportToXML"
import { exportCommandBarToXML } from "~/lib/metadata/forms/elements/commandBar/exportToXML"
import { exportFormDecorationToXML } from "~/lib/metadata/forms/elements/formDecoration/exportToXML"
import { exportFormItemAdditionToXML } from "~/lib/metadata/forms/elements/formItemAddition/exportToXML"
import { Table, TableXML } from "~/lib/metadata/forms/elements/table/types"
import { exportEventsToXML } from "~/lib/metadata/forms/events/exportToXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportTableToXML = (context: Context, data: Table | undefined): TableXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(context, data)!,

    AutoAddIncomplete: data.autoAddIncomplete,
    AutoCommandBar: exportCommandBarToXML(context, data.autoCommandBar),
    AutoInsertNewRow: data.autoInsertNewRow,
    AutoMarkIncomplete: data.autoMarkIncomplete,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxHeightInTableRows: data.autoMaxHeightInTableRows,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(context, data.backColor),
    BehaviorOnHorizontalCompression: data.behaviorOnHorizontalCompression,
    BorderColor: exportColorToXML(context, data.borderColor),
    ChangeRowOrder: data.changeRowOrder,
    ChangeRowSet: data.changeRowSet,
    ChildItems: exportChildItemsToXML(context, data.childItems),
    ChoiceMode: data.choiceMode,
    CommandBar: exportCommandBarToXML(context, data.commandBar),
    CommandBarLocation: data.commandBarLocation,
    CommandSet: exportCommandSetToXML(context, data.commandSet),
    ContextMenu: exportCommandBarToXML(context, data.contextMenu),
    CurrentRowUse: data.currentRowUse,
    DataPath: data.dataPath,
    DefaultItem: data.defaultItem,
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    ExtendedTooltip: exportFormDecorationToXML(context, data.extendedTooltip),
    FileDragMode: data.fileDragMode,
    Font: exportFontToXML(context, data.font),
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
    SearchControl: exportFormItemAdditionToXML(context, data.searchControl),
    SearchControlLocation: data.searchControlLocation,
    SearchOnInput: data.searchOnInput,
    SearchStringLocation: data.searchStringLocation,
    SearchStringRepresentation: exportFormItemAdditionToXML(context, data.searchStringRepresentation),
    SelectionMode: data.selectionMode,
    Shortcut: data.shortcut,
    SkipOnInput: data.skipOnInput,
    TextColor: exportColorToXML(context, data.textColor),
    Title: exportI8nTextToXML(context, data.title),
    TitleFont: exportFontToXML(context, data.titleFont),
    TitleHeight: data.titleHeight,
    TitleLocation: data.titleLocation,
    TitleTextColor: exportColorToXML(context, data.titleTextColor),
    ToolTip: exportI8nTextToXML(context, data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    UseAlternationRowColor: data.useAlternationRowColor,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalLines: data.verticalLines,
    VerticalScrollBar: data.verticalScrollBar,
    VerticalStretch: data.verticalStretch,
    ViewStatusLocation: data.viewStatusLocation,
    ViewStatusRepresentation: exportFormItemAdditionToXML(context, data.viewStatusRepresentation),
    Visible: data.visible,
    Width: data.width,
    Events: exportEventsToXML(context, data.events),
  })
}

registerMetadata("ExportToXML", "Table", exportTableToXML)
