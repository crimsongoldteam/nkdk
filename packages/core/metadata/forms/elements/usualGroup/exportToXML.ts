import { exportColorToXML } from "~/packages/core/metadata/commonObjects/color/exportToXML"
import { exportI8nTextToXML } from "~/packages/core/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/packages/core/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormGroupToXML } from "~/packages/core/metadata/forms/elements/formGroup/exportToXML"
import { exportTableToXML } from "~/packages/core/metadata/forms/elements/table/exportToXML"
import { UsualGroup, UsualGroupXML } from "~/packages/core/metadata/forms/elements/usualGroup/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

export const exportUsualGroupToXML = (context: Context, data: UsualGroup | undefined): UsualGroupXML | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToXML(context, data)!,

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
    VerticalSpacing: data.verticalSpacing,
  })
}

registerMetadata("ExportToXML", "UsualGroup", exportUsualGroupToXML)
