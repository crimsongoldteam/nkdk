import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importPictureFromXML } from "~/lib/metadata/commonObjects/pictures/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TPageXML, TPage } from "./types"
import { ZElementType } from "../types"

export const importPageFromXML = (xml: TPageXML | undefined): TPage | undefined => {
  if (!xml) return undefined

  const base = importFormGroupFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.Page,
    displayImportance: xml.DisplayImportance,
    verticalScrollOnReduceSize: xml.VerticalScrollOnReduceSize,
    verticalAlign: xml.VerticalAlign,
    childItemsVerticalAlign: xml.ChildItemsVerticalAlign,
    verticalSpacing: xml.VerticalSpacing,
    itemsAndTitlesAlign: xml.ItemsAndTitlesAlign,
    childItemsHorizontalAlign: xml.ChildItemsHorizontalAlign,
    horizontalSpacing: xml.HorizontalSpacing,
    group: xml.Group,
    picture: importPictureFromXML(xml.Picture),
    showTitle: xml.ShowTitle,
    titleDataPath: xml.TitleDataPath,
    format: xml.Format,
    backColor: importColorFromXML(xml.BackColor),
    slaveItemsWidth: xml.SlaveItemsWidth,
  }
}