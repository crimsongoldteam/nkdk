import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportFontToXML } from "~/lib/metadata/commonObjects/font/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportTypeDescriptionToXML } from "~/lib/metadata/commonObjects/typeDescription/exportToXML"
import { exportPictureToXML } from "~/lib/metadata/commonObjects/pictures/exportToXML"
import { exportTableToXML } from "../table/exportToXML"
import { exportFormDecorationToXML } from "../formDecoration/exportToXML"
import { exportCommandBarToXML } from "../commandBar/exportToXML"
import { exportBaseElementToXML } from "../baseElement/exportToXML"
import { TFormFieldXML, TFormField } from "./types"

export const exportFormFieldToXML = (data: TFormField | undefined): TFormFieldXML | undefined => {
  if (!data) return undefined

  const base = exportBaseElementToXML(data)
  if (!base) return undefined

  return {
    ...base,
    AutoCellHeight: data.autoCellHeight,
    DefaultItem: data.defaultItem,
    DisplayImportance: data.displayImportance,
    VerticalAlign: data.verticalAlign,
    VerticalAlignInGroup: data.verticalAlignInGroup,
    Type: data.type,
    Visible: data.visible,
    TitleHeight: data.titleHeight,
    CellHyperlink: data.cellHyperlink,
    HorizontalAlign: data.horizontalAlign,
    HorizontalAlignInGroup: data.horizontalAlignInGroup,
    FooterHorizontalAlign: data.footerHorizontalAlign,
    HeaderHorizontalAlign: data.headerHorizontalAlign,
    Enabled: data.enabled,
    Title: exportI8nTextToXML(data.title),
    FooterPicture: exportPictureToXML(data.footerPicture),
    HeaderPicture: exportPictureToXML(data.headerPicture),
    ContextMenu: exportCommandBarToXML(data.contextMenu),
    TypeRestriction: exportTypeDescriptionToXML(data.typeRestriction),
    ShowInFooter: data.showInFooter,
    ShowInHeader: data.showInHeader,
    ToolTipRepresentation: data.toolTipRepresentation,
    WarningOnEditRepresentation: data.warningOnEditRepresentation,
    ToolTip: exportI8nTextToXML(data.toolTip),
    TitleLocation: data.titleLocation,
    WarningOnEdit: data.warningOnEdit,
    SkipOnInput: data.skipOnInput,
    DataPath: data.dataPath,
    FooterDataPath: data.footerDataPath,
    ExtendedTooltip: exportFormDecorationToXML(data.extendedTooltip),
    EditMode: data.editMode,
    Shortcut: data.shortcut,
    Table: exportTableToXML(data.table),
    FooterText: exportI8nTextToXML(data.footerText),
    ReadOnly: data.readOnly,
    FixingInTable: data.fixingInTable,
    TitleTextColor: exportColorToXML(data.titleTextColor),
    FooterTextColor: exportColorToXML(data.footerTextColor),
    TitleBackColor: exportColorToXML(data.titleBackColor),
    FooterBackColor: exportColorToXML(data.footerBackColor),
    TitleFont: exportFontToXML(data.titleFont),
    FooterFont: exportFontToXML(data.footerFont),
  }
}
