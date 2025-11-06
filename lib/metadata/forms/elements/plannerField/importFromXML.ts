import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
import { importTypeDescriptionFromXML } from "~/lib/metadata/commonObjects/typeDescription/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importTableFromXML } from "../table/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { importFormFieldFromXML } from "../formField/importFromXML"
import { TPlannerFieldXML, TPlannerField } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importPlannerFieldFromXML = (xml: TPlannerFieldXML | undefined): TPlannerField | undefined => {
  if (!xml) return undefined

   
  return {
    id: xml._id,
    name: xml._name,
    elementType: ZElementType.enum.PlannerField,
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
    dimensionItemHyperlink: xml.DimensionItemHyperlink,
    enableDrag: xml.EnableDrag,
    enableStartDrag: xml.EnableStartDrag,
    height: xml.Height,
    horizontalStretch: xml.HorizontalStretch,
    maxHeight: xml.MaxHeight,
    maxWidth: xml.MaxWidth,
    timeScaleItemHyperlink: xml.TimeScaleItemHyperlink,
    verticalStretch: xml.VerticalStretch,
    width: xml.Width,
    wrappedTimeScaleHeaderHyperlink: xml.WrappedTimeScaleHeaderHyperlink,
    events: xml.Events ? {
       onChange: xml.Events.OnChange,
       selection: xml.Events.Selection,
       plannerActionClick: xml.Events.PlannerActionClick,
       uRLClick: xml.Events.URLClick,
       wrappedTimeScaleHeaderClick: xml.Events.WrappedTimeScaleHeaderClick,
       dimensionItemClick: xml.Events.DimensionItemClick,
       timeScaleItemClick: xml.Events.TimeScaleItemClick,
       dragStart: xml.Events.DragStart,
       commandGenerateProcessing: xml.Events.CommandGenerateProcessing,
       dragEnd: xml.Events.DragEnd,
       beforeStartQuickEdit: xml.Events.BeforeStartQuickEdit,
       beforeStartEdit: xml.Events.BeforeStartEdit,
       beforePrint: xml.Events.BeforePrint,
       beforeExpandDimensionItem: xml.Events.BeforeExpandDimensionItem,
       beforeCollapseDimensionItem: xml.Events.BeforeCollapseDimensionItem,
       beforeCreate: xml.Events.BeforeCreate,
       beforeDelete: xml.Events.BeforeDelete,
       drag: xml.Events.Drag,
       onActivate: xml.Events.OnActivate,
       onEditEnd: xml.Events.OnEditEnd,
       onCurrentRepresentationPeriodChange: xml.Events.OnCurrentRepresentationPeriodChange,
       dragCheck: xml.Events.DragCheck,
       insideDragCheck: xml.Events.InsideDragCheck,
    } : undefined,
  }
}

registerImport(ZElementType.enum.PlannerField, importPlannerFieldFromXML)