import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importI8nTextFromXML"
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
    associatedTable: importTableFromXML(xml.AssociatedTable),
    backColor: importColorFromXML(xml.BackColor),
    behavior: xml.Behavior,
    childItemsHorizontalAlign: xml.ChildItemsHorizontalAlign,
    childItemsVerticalAlign: xml.ChildItemsVerticalAlign,
    collapsedRepresentationTitle: xml.CollapsedRepresentationTitle,
    controlRepresentation: xml.ControlRepresentation,
    currentRowUse: xml.CurrentRowUse,
    displayImportance: xml._DisplayImportance,
    format: importI8nTextFromXML(xml.Format),
    group: xml.Group,
    hiddenRepresentationTitleBackColor: importColorFromXML(xml.HiddenRepresentationTitleBackColor),
    horizontalSpacing: xml.HorizontalSpacing,
    itemsAndTitlesAlign: xml.ItemsAndTitlesAlign,
    representation: xml.Representation,
    showLeftMargin: xml.ShowLeftMargin,
    showTitle: xml.ShowTitle,
    slaveItemsWidth: xml.SlaveItemsWidth,
    throughAlign: xml.ThroughAlign,
    titleDataPath: xml.TitleDataPath,
    united: xml.United,
    verticalAlign: xml.VerticalAlign,
    verticalSpacing: xml.VerticalSpacing,
  }
}

registerImport(ZElementType.enum.UsualGroup, importUsualGroupFromXML)