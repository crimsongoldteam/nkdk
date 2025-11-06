import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportBorderToXML } from "~/lib/metadata/commonObjects/border/exportToXML"
import { exportTableToXML } from "../table/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { exportFormFieldToXML } from "../formField/exportToXML"
import { TCalendarFieldXML, TCalendarField } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"

export const exportCalendarFieldToXML = (data: TCalendarField | undefined): TCalendarFieldXML | undefined => {
  if (!data) return undefined
 
  return {
   _id: data.id ?? "",
   _name: data.name ?? "",
    AutoCellHeight: data.autoCellHeight,
    CellHyperlink: data.cellHyperlink,
    ContextMenu: exportFormGroupToXML(data.contextMenu),
    DataPath: data.dataPath,
    DefaultItem: data.defaultItem,
    _DisplayImportance: data.displayImportance,
    EditMode: data.editMode,
    Enabled: data.enabled,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    FixingInTable: data.fixingInTable,
    FooterBackColor: exportColorToXML(data.footerBackColor),
    FooterDataPath: data.footerDataPath,
    FooterFont: exportFontToXML(data.footerFont),
    FooterHorizontalAlign: data.footerHorizontalAlign,
    FooterPicture: exportPictureToXML(data.footerPicture),
    FooterText: exportI8nTextToXML(data.footerText),
    FooterTextColor: exportColorToXML(data.footerTextColor),
    HeaderHorizontalAlign: data.headerHorizontalAlign,
    HeaderPicture: exportPictureToXML(data.headerPicture),
    HorizontalAlign: data.horizontalAlign,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    ReadOnly: data.readOnly,
    Shortcut: data.shortcut,
    ShowInFooter: data.showInFooter,
    ShowInHeader: data.showInHeader,
    SkipOnInput: data.skipOnInput,
    Table: exportTableToXML(data.table),
    Title: exportI8nTextToXML(data.title),
    TitleBackColor: exportColorToXML(data.titleBackColor),
    TitleFont: exportFontToXML(data.titleFont),
    TitleHeight: data.titleHeight,
    TitleLocation: data.titleLocation,
    TitleTextColor: exportColorToXML(data.titleTextColor),
    ToolTip: exportI8nTextToXML(data.toolTip),
    ToolTipRepresentation: data.toolTipRepresentation,
    Type: data.type,
    TypeRestriction: exportTypeDescriptionToXML(data.typeRestriction),
    VerticalAlign: data.verticalAlign,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Visible: data.visible,
    WarningOnEdit: exportI8nTextToXML(data.warningOnEdit),
    WarningOnEditRepresentation: data.warningOnEditRepresentation,
    AutoMaxHeight: data.autoMaxHeight,
    AutoMaxWidth: data.autoMaxWidth,
    BeginOfRepresentationPeriod: data.beginOfRepresentationPeriod,
    Border: exportBorderToXML(data.border),
    BorderColor: exportColorToXML(data.borderColor),
    CalendarNavigation: data.calendarNavigation,
    EnableDrag: data.enableDrag,
    EnableStartDrag: data.enableStartDrag,
    EndOfRepresentationPeriod: data.endOfRepresentationPeriod,
    Font: exportFontToXML(data.font),
    Height: data.height,
    HeightInMonths: data.heightInMonths,
    HorizontalStretch: data.horizontalStretch,
    MaxHeight: data.maxHeight,
    MaxWidth: data.maxWidth,
    SelectionMode: data.selectionMode,
    ShowCurrentDate: data.showCurrentDate,
    ShowMonthsPanel: data.showMonthsPanel,
    VerticalStretch: data.verticalStretch,
    Width: data.width,
    WidthInMonths: data.widthInMonths,
    Events: data.events ? {
       OnChange: data.events.onChange,
       Selection: data.events.selection,
       DragStart: data.events.dragStart,
       DragEnd: data.events.dragEnd,
       Drag: data.events.drag,
       OnActivateDate: data.events.onActivateDate,
       OnPeriodOutput: data.events.onPeriodOutput,
       DragCheck: data.events.dragCheck,
    } : undefined,
  }
}

registerExport(ZElementType.enum.CalendarField, exportCalendarFieldToXML)