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
  configurationSettings: ConfigurationSettings,
  xml: UsualGroupXML | undefined
): UsualGroup | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(configurationSettings, xml)!,
    elementType: FormElementType.UsualGroup,

    associatedTable: importTableFromXML(configurationSettings, xml.AssociatedTable),
    backColor: importColorFromXML(configurationSettings, xml.BackColor),
    behavior: xml.Behavior,
    childItemsHorizontalAlign: xml.ChildItemsHorizontalAlign,
    childItemsVerticalAlign: xml.ChildItemsVerticalAlign,
    collapsedRepresentationTitle: xml.CollapsedRepresentationTitle,
    controlRepresentation: xml.ControlRepresentation,
    currentRowUse: xml.CurrentRowUse,
    displayImportance: xml._DisplayImportance,
    format: importI8nTextFromXML(configurationSettings, xml.Format),
    group: xml.Group,
    groupHorizontalAlign: xml.GroupHorizontalAlign,
    groupVerticalAlign: xml.GroupVerticalAlign,
    hiddenRepresentationTitleBackColor: importColorFromXML(
      configurationSettings,
      xml.HiddenRepresentationTitleBackColor
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
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    verticalAlign: xml.VerticalAlign,
    verticalSpacing: xml.VerticalSpacing,
  })
}

registerMetadata("ImportFromXML", "UsualGroup", importUsualGroupFromXML)
