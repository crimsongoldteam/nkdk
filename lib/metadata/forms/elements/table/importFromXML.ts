import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importCommandSetFromXML } from "~/lib/metadata/forms/commandSet/importFromXML"
import { importBaseElementFromXML } from "~/lib/metadata/forms/elements/baseElement/importFromXML"
import { importChildItemsFromXML } from "~/lib/metadata/forms/elements/childItems/importFromXML"
import { importCommandBarFromXML } from "~/lib/metadata/forms/elements/commandBar/importFromXML"
import { importFormDecorationFromXML } from "~/lib/metadata/forms/elements/formDecoration/importFromXML"
import { importFormItemAdditionFromXML } from "~/lib/metadata/forms/elements/formItemAddition/importFromXML"
import { Table, TableXML } from "~/lib/metadata/forms/elements/table/types"
import { importEventsFromXML } from "~/lib/metadata/forms/events/importFromXML"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importTableFromXML = (context: Context, xml: TableXML | undefined): Table | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importBaseElementFromXML(context, xml)!,
    elementType: FormElementType.Table,

    autoAddIncomplete: xml.AutoAddIncomplete,
    autoCommandBar: importCommandBarFromXML(context, xml.AutoCommandBar),
    autoInsertNewRow: xml.AutoInsertNewRow,
    autoMarkIncomplete: xml.AutoMarkIncomplete,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxHeightInTableRows: xml.AutoMaxHeightInTableRows,
    autoMaxWidth: xml.AutoMaxWidth,
    backColor: importColorFromXML(context, xml.BackColor),
    behaviorOnHorizontalCompression: xml.BehaviorOnHorizontalCompression,
    borderColor: importColorFromXML(context, xml.BorderColor),
    changeRowOrder: xml.ChangeRowOrder,
    changeRowSet: xml.ChangeRowSet,
    childItems: importChildItemsFromXML(context, xml.ChildItems),
    choiceMode: xml.ChoiceMode,
    commandBar: importCommandBarFromXML(context, xml.CommandBar),
    commandBarLocation: xml.CommandBarLocation,
    commandSet: importCommandSetFromXML(context, xml.CommandSet),
    contextMenu: importCommandBarFromXML(context, xml.ContextMenu),
    currentRowUse: xml.CurrentRowUse,
    dataPath: xml.DataPath,
    defaultItem: xml.DefaultItem,
    displayImportance: xml._DisplayImportance,
    enabled: xml.Enabled,
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    extendedTooltip: importFormDecorationFromXML(context, xml.ExtendedTooltip),
    fileDragMode: xml.FileDragMode,
    font: importFontFromXML(context, xml.Font),
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
    searchControl: importFormItemAdditionFromXML(context, xml.SearchControl),
    searchControlLocation: xml.SearchControlLocation,
    searchOnInput: xml.SearchOnInput,
    searchStringLocation: xml.SearchStringLocation,
    searchStringRepresentation: importFormItemAdditionFromXML(context, xml.SearchStringRepresentation),
    selectionMode: xml.SelectionMode,
    shortcut: xml.Shortcut,
    skipOnInput: xml.SkipOnInput,
    textColor: importColorFromXML(context, xml.TextColor),
    title: importI8nTextFromXML(context, xml.Title),
    titleFont: importFontFromXML(context, xml.TitleFont),
    titleHeight: xml.TitleHeight,
    titleLocation: xml.TitleLocation,
    titleTextColor: importColorFromXML(context, xml.TitleTextColor),
    toolTip: importI8nTextFromXML(context, xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    useAlternationRowColor: xml.UseAlternationRowColor,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalLines: xml.VerticalLines,
    verticalScrollBar: xml.VerticalScrollBar,
    verticalStretch: xml.VerticalStretch,
    viewStatusLocation: xml.ViewStatusLocation,
    viewStatusRepresentation: importFormItemAdditionFromXML(context, xml.ViewStatusRepresentation),
    visible: xml.Visible,
    width: xml.Width,
    events: importEventsFromXML(context, xml.Events),
  })
}

registerMetadata("ImportFromXML", "Table", importTableFromXML)
