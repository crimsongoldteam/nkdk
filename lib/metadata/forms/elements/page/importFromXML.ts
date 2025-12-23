import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { Page, PageXML } from "~/lib/metadata/forms/elements/page/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

export const importPageFromXML = (
  configurationSettings: ConfigurationSettings,
  xml: PageXML | undefined
): Page | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(configurationSettings, xml)!,
    elementType: FormElementType.Page,

    backColor: importColorFromXML(configurationSettings, xml.BackColor),
    childItemsHorizontalAlign: xml.ChildItemsHorizontalAlign,
    childItemsVerticalAlign: xml.ChildItemsVerticalAlign,
    displayImportance: xml._DisplayImportance,
    format: importI8nTextFromXML(configurationSettings, xml.Format),
    group: xml.Group,
    horizontalSpacing: xml.HorizontalSpacing,
    itemsAndTitlesAlign: xml.ItemsAndTitlesAlign,
    picture: importPictureFromXML(configurationSettings, xml.Picture),
    scrollOnCompress: xml.ScrollOnCompress,
    showTitle: xml.ShowTitle,
    slaveItemsWidth: xml.SlaveItemsWidth,
    titleDataPath: xml.TitleDataPath,
    userVisible: importUserVisibleFromXML(configurationSettings, xml.UserVisible),
    verticalAlign: xml.VerticalAlign,
    verticalScrollOnReduceSize: xml.VerticalScrollOnReduceSize,
    verticalSpacing: xml.VerticalSpacing,
  })
}

registerMetadata("ImportFromXML", "Page", importPageFromXML)
