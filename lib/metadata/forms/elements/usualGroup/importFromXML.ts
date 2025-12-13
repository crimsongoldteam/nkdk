import { importColorFromXML } from "~/lib/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/lib/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/lib/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/lib/metadata/commonObjects/userVisible/importFromXML"
import { registerImport } from "~/lib/xml/import/importerFactory"
import { importChildItemsFromXML } from "../childItems/importFromXML"
import { importFormDecorationFromXML } from "../formDecoration/importFromXML"
import { importFormGroupFromXML } from "../formGroup/importFromXML"
import { importTableFromXML } from "../table/importFromXML"
import { FormElementType } from "../types"
import { UsualGroup, UsualGroupXML } from "./types"

export const importUsualGroupFromXML = (xml: UsualGroupXML | undefined): UsualGroup | undefined => {
  if (!xml) return undefined

  return {
    ...importFormGroupFromXML(xml)!,
    elementType: FormElementType.UsualGroup,

    enableContentChange: xml.EnableContentChange,
    enabled: xml.Enabled,
    extendedTooltip: importFormDecorationFromXML(xml.ExtendedTooltip),
    height: xml.Height,
    horizontalAlignInGroup: xml.HorizontalAlignInGroup,
    horizontalStretch: xml.HorizontalStretch,
    readOnly: xml.ReadOnly,
    shortcut: xml.Shortcut,
    title: importI8nTextFromXML(xml.Title),
    titleFont: importFontFromXML(xml.TitleFont),
    titleTextColor: importColorFromXML(xml.TitleTextColor),
    toolTip: importI8nTextFromXML(xml.ToolTip),
    toolTipRepresentation: xml.ToolTipRepresentation,
    type: xml.Type,
    userVisible: importUserVisibleFromXML(xml.UserVisible),
    verticalAlignInGroup: xml.VerticalAlignInGroup,
    verticalStretch: xml.VerticalStretch,
    visible: xml.Visible,
    width: xml.Width,
    childItems: importChildItemsFromXML(xml.ChildItems),
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
    groupHorizontalAlign: xml.GroupHorizontalAlign,
    groupVerticalAlign: xml.GroupVerticalAlign,
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

registerImport(FormElementType.UsualGroup, importUsualGroupFromXML)
