import { importColorFromXML } from "~/metadata/commonObjects/color/importFromXML"
import { importFontFromXML } from "~/metadata/commonObjects/font/importFromXML"
import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importChildItemsFromXML } from "~/metadata/forms/collections/childItems/importFromXML"
import { UsualGroup } from "~/metadata/forms/elements/usualGroup/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ToXMLType } from "~/metadata/metadataFactory/types"
import { importBaseElementFromXML } from "../baseElement/importFromXML"

export function importUsualGroupFromXML<To extends UsualGroup | undefined>(
  context: ConfigurationContext,
  xml: ToXMLType<To> | undefined
): To {
  if (xml === undefined) return undefined as To

  const baseFields = importBaseElementFromXML(context, xml)

  const result: UsualGroup = {
    ...baseFields,
    elementType: "UsualGroup",
    childItems: [],
  }

  const childItems = importChildItemsFromXML(context, xml.ChildItems)
  if (childItems !== undefined && childItems.length > 0) result.childItems = childItems

  // const associatedTable = importTableFromXML(context, xml.AssociatedTable)
  // if (associatedTable !== undefined) result.associatedTable = associatedTable

  if (xml.EnableContentChange !== undefined) result.enableContentChange = xml.EnableContentChange

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  if (xml.Height !== undefined) result.height = xml.Height

  if (xml.HorizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = xml.HorizontalAlignInGroup

  if (xml.HorizontalStretch !== undefined) result.horizontalStretch = xml.HorizontalStretch

  if (xml.ReadOnly !== undefined) result.readOnly = xml.ReadOnly

  if (xml.Shortcut !== undefined) result.shortcut = xml.Shortcut

  const title = importI8nTextFromXML(context, xml.Title)
  if (title !== undefined) result.title = title

  const titleFont = importFontFromXML(context, xml.TitleFont)
  if (titleFont !== undefined) result.titleFont = titleFont

  const titleTextColor = importColorFromXML(context, xml.TitleTextColor)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  const toolTip = importI8nTextFromXML(context, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  if (xml.Type !== undefined) result.type = xml.Type

  if (xml.VerticalAlignInGroup !== undefined) result.verticalAlignInGroup = xml.VerticalAlignInGroup

  if (xml.VerticalStretch !== undefined) result.verticalStretch = xml.VerticalStretch

  if (xml.Visible !== undefined) result.visible = xml.Visible

  if (xml.Width !== undefined) result.width = xml.Width

  const backColor = importColorFromXML(context, xml.BackColor)
  if (backColor !== undefined) result.backColor = backColor

  if (xml.Behavior !== undefined) result.behavior = xml.Behavior

  if (xml.ChildItemsHorizontalAlign !== undefined) result.childItemsHorizontalAlign = xml.ChildItemsHorizontalAlign

  if (xml.ChildItemsVerticalAlign !== undefined) result.childItemsVerticalAlign = xml.ChildItemsVerticalAlign

  if (xml.CollapsedRepresentationTitle !== undefined)
    result.collapsedRepresentationTitle = xml.CollapsedRepresentationTitle

  if (xml.ControlRepresentation !== undefined) result.controlRepresentation = xml.ControlRepresentation

  if (xml.CurrentRowUse !== undefined) result.currentRowUse = xml.CurrentRowUse

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  const format = importI8nTextFromXML(context, xml.Format)
  if (format !== undefined) result.format = format

  if (xml.Group !== undefined) result.group = xml.Group

  if (xml.GroupHorizontalAlign !== undefined) result.groupHorizontalAlign = xml.GroupHorizontalAlign

  if (xml.GroupVerticalAlign !== undefined) result.groupVerticalAlign = xml.GroupVerticalAlign

  const hiddenRepresentationTitleBackColor = importColorFromXML(context, xml.HiddenRepresentationTitleBackColor)
  if (hiddenRepresentationTitleBackColor !== undefined)
    result.hiddenRepresentationTitleBackColor = hiddenRepresentationTitleBackColor

  if (xml.HorizontalSpacing !== undefined) result.horizontalSpacing = xml.HorizontalSpacing

  if (xml.ItemsAndTitlesAlign !== undefined) result.itemsAndTitlesAlign = xml.ItemsAndTitlesAlign

  if (xml.Representation !== undefined) result.representation = xml.Representation

  if (xml.ShowLeftMargin !== undefined) result.showLeftMargin = xml.ShowLeftMargin

  if (xml.ShowTitle !== undefined) result.showTitle = xml.ShowTitle

  if (xml.SlaveItemsWidth !== undefined) result.slaveItemsWidth = xml.SlaveItemsWidth

  if (xml.ThroughAlign !== undefined) result.throughAlign = xml.ThroughAlign

  if (xml.TitleDataPath !== undefined) result.titleDataPath = xml.TitleDataPath

  if (xml.United !== undefined) result.united = xml.United

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlign !== undefined) result.verticalAlign = xml.VerticalAlign

  if (xml.VerticalSpacing !== undefined) result.verticalSpacing = xml.VerticalSpacing

  return result as To
}

registerMetadata("ImportFromXML", "UsualGroup", importUsualGroupFromXML as any)
