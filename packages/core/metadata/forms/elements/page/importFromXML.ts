import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importPictureFromXML } from "~/metadata/commonObjects/picture/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importChildItemsFromXML } from "~/metadata/forms/collections/childItems/importFromXML"
import { importFormGroupFromXML } from "~/metadata/forms/elements/formGroup/importFromXML"
import { Page, PageXML } from "~/metadata/forms/elements/page/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"

export const importPageFromXML = <From extends PageXML | undefined>(
  context: ConfigurationContext,
  xml: From
): ImportExportReturn<From, Page> => {
  if (!xml) return undefined as ImportExportReturn<From, Page>

  const baseFields = importFormGroupFromXML(context, xml)

  const result: Page = {
    ...baseFields,
    elementType: FormElementType.Page,
    childItems: [],
  }

  const childItems = importChildItemsFromXML(context, xml.ChildItems)
  if (childItems !== undefined && childItems.length > 0) result.childItems = childItems

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  if (xml.ChildItemsHorizontalAlign !== undefined) result.childItemsHorizontalAlign = xml.ChildItemsHorizontalAlign

  if (xml.ChildItemsVerticalAlign !== undefined) result.childItemsVerticalAlign = xml.ChildItemsVerticalAlign

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  const format = importI8nTextFromXML(context, xml.Format)
  if (format !== undefined) result.format = format

  if (xml.Group !== undefined) result.group = xml.Group

  if (xml.HorizontalSpacing !== undefined) result.horizontalSpacing = xml.HorizontalSpacing

  if (xml.ItemsAndTitlesAlign !== undefined) result.itemsAndTitlesAlign = xml.ItemsAndTitlesAlign

  const picture = importPictureFromXML(context, xml.Picture)
  if (picture !== undefined) result.picture = picture

  if (xml.ScrollOnCompress !== undefined) result.scrollOnCompress = xml.ScrollOnCompress

  if (xml.ShowTitle !== undefined) result.showTitle = xml.ShowTitle

  if (xml.SlaveItemsWidth !== undefined) result.slaveItemsWidth = xml.SlaveItemsWidth

  if (xml.TitleDataPath !== undefined) result.titleDataPath = xml.TitleDataPath

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlign !== undefined) result.verticalAlign = xml.VerticalAlign

  if (xml.VerticalScrollOnReduceSize !== undefined) result.verticalScrollOnReduceSize = xml.VerticalScrollOnReduceSize

  if (xml.VerticalSpacing !== undefined) result.verticalSpacing = xml.VerticalSpacing

  return result as ImportExportReturn<From, Page>
}

registerMetadata("ImportFromXML", "Page", importPageFromXML)
