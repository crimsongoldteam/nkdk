import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importTableFromXML } from "../table/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TSpreadSheetDocumentFieldXML, TSpreadSheetDocumentField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importSpreadSheetDocumentFieldFromXML = (xml: TSpreadSheetDocumentFieldXML | undefined): TSpreadSheetDocumentField | undefined => {
  if (!xml) return undefined

   
  return {
    id: xml._id,
    name: xml._name,
    elementType: ZElementType.enum.SpreadSheetDocumentField,
    autoCellHeight: xml.AutoCellHeight,
    cellHyperlink: xml.CellHyperlink,
    contextMenu: importFormGroupFromXML(xml.ContextMenu),
    dataPath: xml.DataPath,
    defaultItem: xml.DefaultItem,
    displayImportance: xml._DisplayImportance,
    editMode: xml.EditMode,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    fixingInTable: xml.FixingInTable,
    footerBackColor: importColorFromXML(xml.FooterBackColor),
    footerDataPath: xml.FooterDataPath,
    footerFont: importFontFromXML(xml.FooterFont),
    footerHorizontalAlign: xml.FooterHorizontalAlign,
    footerPicture: importPictureFromXML(xml.FooterPicture),
    footerText: importI8nTextFromXML(xml.FooterText),
    footerTextColor: importColorFromXML(xml.FooterTextColor),
    headerHorizontalAlign: xml.HeaderHorizontalAlign,
    headerPicture: importPictureFromXML(xml.HeaderPicture),
    horizontalAlign: xml.HorizontalAlign,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    readOnly: xml.ReadOnly,
    shortcut: xml.Shortcut,
    showInFooter: xml.ShowInFooter,
    showInHeader: xml.ShowInHeader,
    skipOnInput: xml.SkipOnInput,
    table: importTableFromXML(xml.Table),
    title: importI8nTextFromXML(xml.Title),
    titleBackColor: importColorFromXML(xml.TitleBackColor),
    titleFont: importFontFromXML(xml.TitleFont),
    titleHeight: xml.TitleHeight,
    titleLocation: xml.TitleLocation,
    titleTextColor: importColorFromXML(xml.TitleTextColor),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    typeRestriction: importTypeDescriptionFromXML(xml.TypeRestriction),
    verticalAlign: xml.VerticalAlign,
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    visible: xml.Visible,
    warningOnEdit: importI8nTextFromXML(xml.WarningOnEdit),
    warningOnEditRepresentation: xml.WarningOnEditRepresentation,
    autoMaxHeight: xml.AutoMaxHeight,
    autoMaxWidth: xml.AutoMaxWidth,
    blackAndWhiteView: xml.BlackAndWhiteView,
    borderColor: importColorFromXML(xml.BorderColor),
    drawingSelectionShowMode: xml.DrawingSelectionShowMode,
    edit: xml.Edit,
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    height: xml.Height,
    horizontalScrollBar: xml.HorizontalScrollBar,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    output: xml.Output,
    pointerType: xml.PointerType,
    protection: xml.Protection,
    selectionShowMode: xml.SelectionShowMode,
    showCellNames: xml.ShowCellNames,
    showGrid: xml.ShowGrid,
    showGroups: xml.ShowGroups,
    showHeaders: xml.ShowHeaders,
    showRowAndColumnNames: xml.ShowRowAndColumnNames,
    statePresentation: xml.StatePresentation,
    usedFileName: xml.UsedFileName,
    verticalScrollBar: xml.VerticalScrollBar,
    verticalStretch: xml.VerticalStretch,
    viewScalingMode: xml.ViewScalingMode,
    width: xml.Width,
    events: xml.Events ? {
       onChange: xml.Events.OnChange,
       selection: xml.Events.Selection,
       dragStart: xml.Events.DragStart,
       additionalDetailProcessing: xml.Events.AdditionalDetailProcessing,
       uRLProcessing: xml.Events.URLProcessing,
       detailProcessing: xml.Events.DetailProcessing,
       dragEnd: xml.Events.DragEnd,
       beforeWrite: xml.Events.BeforeWrite,
       beforePrint: xml.Events.BeforePrint,
       drag: xml.Events.Drag,
       afterWrite: xml.Events.AfterWrite,
       onActivate: xml.Events.OnActivate,
       onChangeAreaContentEvent: xml.Events.OnChangeAreaContentEvent,
       dragCheck: xml.Events.DragCheck,
    } : undefined,
  }
}

registerImport(ZElementType.enum.SpreadSheetDocumentField, importSpreadSheetDocumentFieldFromXML)