import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { importTableFromXML } from "~/lib/metadata/forms/elements/table/importFromXML"
import { UsualGroup, UsualGroupXML } from "~/lib/metadata/forms/elements/usualGroup/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importUsualGroupFromXML = (
  xml: UsualGroupXML | undefined,
  configurationSettings: ConfigurationSettings
): UsualGroup | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(xml, configurationSettings)!,
    elementType: FormElementType.UsualGroup,

    associatedTable: importTableFromXML(xml.AssociatedTable, configurationSettings),
    backColor: importColorFromXML(xml.BackColor, configurationSettings),
    behavior: xml.Behavior,
    childItemsHorizontalAlign: xml.ChildItemsHorizontalAlign,
    childItemsVerticalAlign: xml.ChildItemsVerticalAlign,
    collapsedRepresentationTitle: xml.CollapsedRepresentationTitle,
    controlRepresentation: xml.ControlRepresentation,
    currentRowUse: xml.CurrentRowUse,
    displayImportance: xml._DisplayImportance,
    format: importI8nTextFromXML(xml.Format, configurationSettings),
    group: xml.Group,
    groupHorizontalAlign: xml.GroupHorizontalAlign,
    groupVerticalAlign: xml.GroupVerticalAlign,
    hiddenRepresentationTitleBackColor: importColorFromXML(
      xml.HiddenRepresentationTitleBackColor,
      configurationSettings
    ),
    horizontalSpacing: xml.HorizontalSpacing,
    itemsAndTitlesAlign: xml.ItemsAndTitlesAlign,
    representation: xml.Representation,
    showLeftMargin: xml.ShowLeftMargin,
    showTitle: xml.ShowTitle,
    slaveItemsWidth: xml.SlaveItemsWidth,
    throughAlign: xml.ThroughAlign,
    titleDataPath: xml.TitleDataPath,
    united: xml.United,
    userVisible: importUserVisibleFromXML(xml.UserVisible, configurationSettings),
    verticalAlign: xml.VerticalAlign,
    verticalSpacing: xml.VerticalSpacing,
  })
}

registerMetadata("ImportFromXML", "UsualGroup", importUsualGroupFromXML)
