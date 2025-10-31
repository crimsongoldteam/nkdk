import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importTableFromXML } from "../table/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { TUsualGroupXML, TUsualGroup } from "./types"
import { ZElementType } from "../types"
import { registerImport } from "~/lib/xml/import/importerFactory"

export const importUsualGroupFromXML = (xml: TUsualGroupXML | undefined): TUsualGroup | undefined => {
  if (!xml) return undefined

  const base = importFormGroupFromXML(xml)
  if (!base) return undefined
   
  return {
    ...base,
    elementType: ZElementType.enum.UsualGroup,
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
    associatedTable: importTableFromXML(xml.AssociatedTable),
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

registerImport(ZElementType.enum.UsualGroup, importUsualGroupFromXML)