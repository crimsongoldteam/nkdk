import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { importTableFromXML } from "~/metadata/forms/elements/table/importFromXML"
import { UsualGroup, UsualGroupXML } from "~/metadata/forms/elements/usualGroup/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importUsualGroupFromXML = (
  context: ConfigurationContext,
  xml: UsualGroupXML | undefined
): UsualGroup | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(context, xml)!,
    elementType: FormElementType.UsualGroup,

    associatedTable: importTableFromXML(context, xml.AssociatedTable),
    backColor: importColorFromXML(context, xml.BackColor),
    behavior: xml.Behavior,
    childItemsHorizontalAlign: xml.ChildItemsHorizontalAlign,
    childItemsVerticalAlign: xml.ChildItemsVerticalAlign,
    collapsedRepresentationTitle: xml.CollapsedRepresentationTitle,
    controlRepresentation: xml.ControlRepresentation,
    currentRowUse: xml.CurrentRowUse,
    displayImportance: xml._DisplayImportance,
    format: importI8nTextFromXML(context, xml.Format),
    group: xml.Group,
    groupHorizontalAlign: xml.GroupHorizontalAlign,
    groupVerticalAlign: xml.GroupVerticalAlign,
    hiddenRepresentationTitleBackColor: importColorFromXML(context, xml.HiddenRepresentationTitleBackColor),
    horizontalSpacing: xml.HorizontalSpacing,
    itemsAndTitlesAlign: xml.ItemsAndTitlesAlign,
    representation: xml.Representation,
    showLeftMargin: xml.ShowLeftMargin,
    showTitle: xml.ShowTitle,
    slaveItemsWidth: xml.SlaveItemsWidth,
    throughAlign: xml.ThroughAlign,
    titleDataPath: xml.TitleDataPath,
    united: xml.United,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalAlign: xml.VerticalAlign,
    verticalSpacing: xml.VerticalSpacing,
  })
}

registerMetadata("ImportFromXML", "UsualGroup", importUsualGroupFromXML)
