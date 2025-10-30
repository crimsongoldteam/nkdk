import importColorFromXML from "~/lib/metadata/color/importFromXML"
import importPictureFromXML from "../../pictures/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TPageXML, TPage } from "./types"


export const importPageFromXML = (xml: TPageXML | undefined): TPage | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
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