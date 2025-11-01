import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportTableToXML } from "../table/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TUsualGroupXML, TUsualGroup } from "./types"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { ZElementType } from "../types"
import { sortObjectKeys } from "~/lib/xml/export/sortObjectKeys"

export const exportUsualGroupToXML = (data: TUsualGroup | undefined): TUsualGroupXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined

  const result = {
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
    Format: data.format,
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
  }

  return result
}

registerExport(ZElementType.enum.UsualGroup, exportUsualGroupToXML)
