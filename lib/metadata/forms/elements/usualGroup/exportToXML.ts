import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { exportTableToXML } from "~/lib/metadata/forms/elements/table/exportToXML"
import { registerExport } from "~/lib/xml/export/exporterFactory"
import { FormElementType } from "../types"

export const exportUsualGroupToXML = (data: UsualGroup | undefined): UsualGroupXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToXML(data)!,

    AssociatedTable: exportTableToXML(data.associatedTable),
    BackColor: exportColorToXML(data.backColor),
    Behavior: data.behavior,
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    CollapsedRepresentationTitle: data.collapsedRepresentationTitle,
    ControlRepresentation: data.controlRepresentation,
    CurrentRowUse: data.currentRowUse,
    _DisplayImportance: data.displayImportance,
    Format: exportI8nTextToXML(data.format),
    Group: data.group,
    GroupHorizontalAlign: data.groupHorizontalAlign,
    GroupVerticalAlign: data.groupVerticalAlign,
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
    UserVisible: exportUserVisibleToXML(data.userVisible),
  }
}

registerExport(FormElementType.UsualGroup, exportUsualGroupToXML)
