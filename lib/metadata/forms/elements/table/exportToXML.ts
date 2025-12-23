import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
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

export const exportTableToXML = (
  configurationSettings: ConfigurationSettings,
  data: Table | undefined
): TableXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportBaseElementToXML(configurationSettings, data)!,

    AutoAddIncomplete: data.autoAddIncomplete,
    AutoCommandBar: exportCommandBarToXML(configurationSettings, data.autoCommandBar),
    AutoInsertNewRow: data.autoInsertNewRow,
    AutoMarkIncomplete: data.autoMarkIncomplete,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxHeightInTableRows: data.autoMaxHeightInTableRows,
    AutoMaxWidth: data.autoMaxWidth,
    BackColor: exportColorToXML(configurationSettings, data.backColor),
    BehaviorOnHorizontalCompression: data.behaviorOnHorizontalCompression,
    BorderColor: exportColorToXML(configurationSettings, data.borderColor),
    ChangeRowOrder: data.changeRowOrder,
    ChangeRowSet: data.changeRowSet,
    ChildItems: exportChildItemsToXML(configurationSettings, data.childItems),
    ChoiceMode: data.choiceMode,
    CommandBar: exportCommandBarToXML(configurationSettings, data.commandBar),
    CommandBarLocation: data.commandBarLocation,
    CommandSet: exportCommandSetToXML(configurationSettings, data.commandSet),
    ContextMenu: exportCommandBarToXML(configurationSettings, data.contextMenu),
    CurrentRowUse: data.currentRowUse,
    DataPath: data.dataPath,
    DefaultItem: data.defaultItem,
    _DisplayImportance: data.displayImportance,
    Enabled: data.enabled,
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    ExtendedTooltip: exportFormDecorationToXML(configurationSettings, data.extendedTooltip),
    FileDragMode: data.fileDragMode,
    Font: exportFontToXML(configurationSettings, data.font),
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
    SearchControl: exportFormItemAdditionToXML(configurationSettings, data.searchControl),
    SearchControlLocation: data.searchControlLocation,
    SearchOnInput: data.searchOnInput,
    SearchStringLocation: data.searchStringLocation,
    SearchStringRepresentation: exportFormItemAdditionToXML(configurationSettings, data.searchStringRepresentation),
    SelectionMode: data.selectionMode,
    Shortcut: data.shortcut,
    SkipOnInput: data.skipOnInput,
    TextColor: exportColorToXML(configurationSettings, data.textColor),
    Title: exportI8nTextToXML(configurationSettings, data.title),
    TitleFont: exportFontToXML(configurationSettings, data.titleFont),
    TitleHeight: data.titleHeight,
    TitleLocation: data.titleLocation,
    TitleTextColor: exportColorToXML(configurationSettings, data.titleTextColor),
    ToolTip: exportI8nTextToXML(configurationSettings, data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    UseAlternationRowColor: data.useAlternationRowColor,
    UserVisible: exportUserVisibleToXML(configurationSettings, data.userVisible),
    VerticalAlignInGroup: data.verticalAlignInGroup,
    VerticalLines: data.verticalLines,
    VerticalScrollBar: data.verticalScrollBar,
    VerticalStretch: data.verticalStretch,
    ViewStatusLocation: data.viewStatusLocation,
    ViewStatusRepresentation: exportFormItemAdditionToXML(configurationSettings, data.viewStatusRepresentation),
    Visible: data.visible,
    Width: data.width,
    Events: exportEventsToXML(configurationSettings, data.events),
  })
}

registerMetadata("ExportToXML", "Table", exportTableToXML)
