import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { Context } from "~/lib/metadata/context/types"
import { importFormGroupFromXML } from "~/lib/metadata/forms/elements/formGroup/importFromXML"
import { Page, PageXML } from "~/lib/metadata/forms/elements/page/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/lib/metadata/metadataFactory/types"

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
