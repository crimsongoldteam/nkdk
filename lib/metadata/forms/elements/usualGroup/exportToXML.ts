import { exportColorToXML } from "~/lib/metadata/commonObjects/color/exportToXML"
import { exportI8nTextToXML } from "~/lib/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/lib/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { exportFormGroupToXML } from "~/lib/metadata/forms/elements/formGroup/exportToXML"
import { exportTableToXML } from "~/lib/metadata/forms/elements/table/exportToXML"
import { UsualGroup, UsualGroupXML } from "~/lib/metadata/forms/elements/usualGroup/types"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportUsualGroupToXML = (
  data: UsualGroup | undefined,
  configurationSettings: ConfigurationSettings
): UsualGroupXML | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToXML(data, configurationSettings)!,

    AssociatedTable: exportTableToXML(data.associatedTable, configurationSettings),
    BackColor: exportColorToXML(data.backColor, configurationSettings),
    Behavior: data.behavior,
    ChildItemsHorizontalAlign: data.childItemsHorizontalAlign,
    ChildItemsVerticalAlign: data.childItemsVerticalAlign,
    CollapsedRepresentationTitle: data.collapsedRepresentationTitle,
    ControlRepresentation: data.controlRepresentation,
    CurrentRowUse: data.currentRowUse,
    _DisplayImportance: data.displayImportance,
    Format: exportI8nTextToXML(data.format, configurationSettings),
    Group: data.group,
    GroupHorizontalAlign: data.groupHorizontalAlign,
    GroupVerticalAlign: data.groupVerticalAlign,
    HiddenRepresentationTitleBackColor: exportColorToXML(
      data.hiddenRepresentationTitleBackColor,
      configurationSettings
    ),
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
    UserVisible: exportUserVisibleToXML(data.userVisible, configurationSettings),
  }
}

registerMetadata("ExportToXML", "UsualGroup", exportUsualGroupToXML)
