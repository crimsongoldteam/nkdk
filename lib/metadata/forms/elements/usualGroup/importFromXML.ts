import importColorFromXML from "~/lib/metadata/color/importFromXML"
import { importBaseElementFromXML } from "../baseElement/importBaseElementFromXML"
import { TUsualGroupXML, TUsualGroup } from "./types"


export const importUsualGroupFromXML = (xml: TUsualGroupXML | undefined): TUsualGroup | undefined => {
   if (!xml) return undefined
   return {
    ...importBaseElementFromXML(xml),
     displayImportance: xml.DisplayImportance,
     verticalAlign: xml.VerticalAlign,
     childItemsVerticalAlign: xml.ChildItemsVerticalAlign,
     verticalSpacing: xml.VerticalSpacing,
     itemsAndTitlesAlign: xml.ItemsAndTitlesAlign,
     childItemsHorizontalAlign: xml.ChildItemsHorizontalAlign,
     horizontalSpacing: xml.HorizontalSpacing,
     group: xml.Group,
     collapsedRepresentationTitle: xml.CollapsedRepresentationTitle,
     currentRowUse: xml.CurrentRowUse,
     associatedTable: xml.AssociatedTable,
     united: xml.United,
     showTitle: xml.ShowTitle,
     showLeftMargin: xml.ShowLeftMargin,
     representation: xml.Representation,
     controlRepresentation: xml.ControlRepresentation,
     behavior: xml.Behavior,
     titleDataPath: xml.TitleDataPath,
     throughAlign: xml.ThroughAlign,
     format: xml.Format,
     backColor: importColorFromXML(xml.BackColor),
     hiddenRepresentationTitleBackColor: importColorFromXML(xml.HiddenRepresentationTitleBackColor),
     slaveItemsWidth: xml.SlaveItemsWidth,
  }
}