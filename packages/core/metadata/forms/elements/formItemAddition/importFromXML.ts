import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importChildItemsFromXML } from "~/metadata/forms/collections/childItems/importFromXML"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { importContextMenuFromXML } from "~/metadata/forms/elements/contextMenu/importFromXML"
import { FormItemAddition, FormItemAdditionXML } from "~/metadata/forms/elements/formItemAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importExtendedTooltipFromXML } from "../extendedTooltip/importFromXML"
import { ImportExportReturn } from "../types"

export const importFormItemAdditionFromXML = <T extends FormItemAdditionXML | undefined>(
  context: ConfigurationContext,
  xml: T
): ImportExportReturn<T, FormItemAddition> => {
  if (!xml) return undefined as ImportExportReturn<T, FormItemAddition>
  const baseFields = importBaseElementFromXML(context, xml)

  const result: FormItemAddition = {
    ...baseFields,
    elementType: FormElementType.FormItemAddition,
  }

  const childItems = importChildItemsFromXML(context, xml.ChildItems)
  result.childItems = childItems

  const contextMenu = importContextMenuFromXML(context, xml.ContextMenu, result)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  const extendedToolTip = importExtendedTooltipFromXML(context, xml.ExtendedTooltip, result)
  if (extendedToolTip !== undefined) result.extendedTooltip = extendedToolTip

  if (xml.HorizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = xml.HorizontalAlignInGroup

  const title = importI8nTextFromXML(context, xml.Title)
  if (title !== undefined) result.title = title

  const toolTip = importI8nTextFromXML(context, xml.ToolTip)
  if (toolTip !== undefined) result.toolTip = toolTip

  if (xml.ToolTipRepresentation !== undefined) result.toolTipRepresentation = xml.ToolTipRepresentation

  if (xml.Type !== undefined) result.type = xml.Type

  const userVisible = importUserVisibleFromXML(context, xml.UserVisible)
  if (userVisible !== undefined) result.userVisible = userVisible

  if (xml.VerticalAlignInGroup !== undefined) result.verticalAlignInGroup = xml.VerticalAlignInGroup

  if (xml.Visible !== undefined) result.visible = xml.Visible

  return result as ImportExportReturn<T, FormItemAddition>
}

registerMetadata("ImportFromXML", "FormItemAddition", importFormItemAdditionFromXML)
