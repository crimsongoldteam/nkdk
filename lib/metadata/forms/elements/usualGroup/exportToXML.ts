import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportI8nTextToXML"
import { exportTableToXML } from "../table/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TUsualGroupXML, TUsualGroup } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectByKeys } from "~/lib/xml/export/sortObjectKeys"

const ORDER = ["Visible", "UserVisible", "Enabled", "ReadOnly", "EnableContentChange", "Title", "TitleTextColor", "TitleFont", "ToolTip", "ToolTipRepresentation", "Shortcut", "Width", "Height", "HorizontalStretch", "VerticalStretch", "GroupHorizontalAlign", "GroupVerticalAlign", "Group", "ChildrenAlign", "HorizontalSpacing", "VerticalSpacing", "HorizontalAlign", "VerticalAlign", "Behavior", "CollapsedRepresentationTitle", "Collapsed", "ControlRepresentation", "Representation", "ShowLeftMargin", "United", "Format", "ShowTitle", "TitleDataPath", "BackColor", "HiddenStateTitleBackColor", "CurrentRowUse", "ExtendedTooltip"]

export const exportUsualGroupToXML = (data: TUsualGroup | undefined): TUsualGroupXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return sortObjectByKeys<TUsualGroupXML>( {
    ...base,
    AssociatedTable: exportTableToXML(data.associatedTable),
    BackColor: exportColorToXML(data.backColor),
    Behavior: data.behavior,
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    CollapsedRepresentationTitle: data.collapsedRepresentationTitle,
    ControlRepresentation: data.controlRepresentation,
    CurrentRowUse: data.currentRowUse,
    DisplayImportance: data.displayImportance,
    Format: exportI8nTextToXML(data.format),
    Group: data.group,
    HiddenRepresentationTitleBackColor: exportColorToXML(data.hiddenRepresentationTitleBackColor),
    HorizontalSpacing: data.horizontalSpacing,
    ItemsAndTitlesAlign: data.itemsAndTitlesAlign,
    Representation: data.representation,
    ShowLeftMargin: data.showLeftMargin,
    ShowTitle: data.showTitle,
    SlaveItemsWidth: data.slaveItemsWidth,
    ThroughAlign: data.throughAlign,
    TitleDataPath: data.titleDataPath,
    United: data.united,
    VerticalAlign: data.verticalAlign,
    VerticalSpacing: data.verticalSpacing,
  }, ORDER)
}

registerExport(ZElementType.enum.UsualGroup, exportUsualGroupToXML)