import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { Context } from "~/lib/metadata/context/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { exportTableToXML } from "~/lib/metadata/forms/elements/table/exportToXML"
import { UsualGroup, UsualGroupXML } from "~/lib/metadata/forms/elements/usualGroup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

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
