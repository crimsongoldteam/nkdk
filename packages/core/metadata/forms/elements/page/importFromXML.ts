import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/metadata/context/types"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { Page, PageXML } from "~/metadata/forms/elements/page/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importPageFromXML = (context: Context, xml: PageXML | undefined): Page | undefined => {
  if (!xml) return undefined

  return compactObject({
    ...importFormGroupFromXML(context, xml)!,
    elementType: FormElementType.Page,

    backColor: importColorFromXML(context, xml.BackColor),
    childItemsHorizontalAlign: xml.ChildItemsHorizontalAlign,
    childItemsVerticalAlign: xml.ChildItemsVerticalAlign,
    displayImportance: xml._DisplayImportance,
    format: importI8nTextFromXML(context, xml.Format),
    group: xml.Group,
    horizontalSpacing: xml.HorizontalSpacing,
    itemsAndTitlesAlign: xml.ItemsAndTitlesAlign,
    picture: importPictureFromXML(context, xml.Picture),
    scrollOnCompress: xml.ScrollOnCompress,
    showTitle: xml.ShowTitle,
    slaveItemsWidth: xml.SlaveItemsWidth,
    titleDataPath: xml.TitleDataPath,
    userVisible: importUserVisibleFromXML(context, xml.UserVisible),
    verticalAlign: xml.VerticalAlign,
    verticalScrollOnReduceSize: xml.VerticalScrollOnReduceSize,
    verticalSpacing: xml.VerticalSpacing,
  })
}

registerMetadata("ImportFromXML", "Page", importPageFromXML)
