import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportTableToXML } from "../table/exportToXML"
import { exportFormGroupToXML } from "../formGroup/exportToXML"
import { TUsualGroupXML, TUsualGroup } from "./types"

export const exportUsualGroupToXML = (data: TUsualGroup | undefined): TUsualGroupXML | undefined => {
  if (!data) return undefined

  const base = exportFormGroupToXML(data)
  if (!base) return undefined
   
  return {
    ...base,
    DisplayImportance: data.displayImportance,
    VerticalAlign: data.verticalAlign,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    VerticalSpacing: data.verticalSpacing,
    ItemsAndTitlesAlign: data.itemsAndTitlesAlign,
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    HorizontalSpacing: data.horizontalSpacing,
    Group: data.group,
    CollapsedRepresentationTitle: data.collapsedRepresentationTitle,
    CurrentRowUse: data.currentRowUse,
    AssociatedTable: exportTableToXML(data.associatedTable),
    United: data.united,
    ShowTitle: data.showTitle,
    ShowLeftMargin: data.showLeftMargin,
    Representation: data.representation,
    ControlRepresentation: data.controlRepresentation,
    Behavior: data.behavior,
    TitleDataPath: data.titleDataPath,
    ThroughAlign: data.throughAlign,
    Format: data.format,
    BackColor: exportColorToXML(data.backColor),
    HiddenRepresentationTitleBackColor: exportColorToXML(data.hiddenRepresentationTitleBackColor),
    SlaveItemsWidth: data.slaveItemsWidth,
  }
}