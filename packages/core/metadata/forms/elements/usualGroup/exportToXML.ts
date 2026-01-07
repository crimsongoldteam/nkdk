import { exportColorToXML } from "~/metadata/commonObjects/color/exportToXML"
import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormGroupToXML } from "~/metadata/forms/elements/formGroup/exportToXML"
import { exportTableToXML } from "~/metadata/forms/elements/table/exportToXML"
import { UsualGroup, UsualGroupXML } from "~/metadata/forms/elements/usualGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportUsualGroupToXML = (
  context: ConfigurationContext,
  data: UsualGroup | undefined
): UsualGroupXML | undefined => {
  if (!data) return undefined

  const baseFields = exportFormGroupToXML(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,

    AssociatedTable: exportTableToXML(context, data.associatedTable),
    BackColor: exportColorToXML(context, data.backColor),
    Behavior: data.behavior,
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    CollapsedRepresentationTitle: data.collapsedRepresentationTitle,
    ControlRepresentation: data.controlRepresentation,
    CurrentRowUse: data.currentRowUse,
    _DisplayImportance: data.displayImportance,
    Format: exportI8nTextToXML(context, data.format),
    Group: data.group,
    GroupHorizontalAlign: data.groupHorizontalAlign,
    GroupVerticalAlign: data.groupVerticalAlign,
    HiddenRepresentationTitleBackColor: exportColorToXML(context, data.hiddenRepresentationTitleBackColor),
    HorizontalSpacing: data.horizontalSpacing,
    ItemsAndTitlesAlign: data.itemsAndTitlesAlign,
    Representation: data.representation,
    ShowLeftMargin: data.showLeftMargin,
    ShowTitle: data.showTitle,
    SlaveItemsWidth: data.slaveItemsWidth,
    ThroughAlign: data.throughAlign,
    TitleDataPath: data.titleDataPath,
    United: data.united,
    UserVisible: exportUserVisibleToXML(context, data.userVisible),
    VerticalAlign: data.verticalAlign,
    VerticalSpacing: data.verticalSpacing,  }
}

registerMetadata("ExportToXML", "UsualGroup", exportUsualGroupToXML)
