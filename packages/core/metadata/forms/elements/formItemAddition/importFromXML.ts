import { importI8nTextFromXML } from "~/metadata/commonObjects/i8nText/importFromXML"
import { importUserVisibleFromXML } from "~/metadata/commonObjects/userVisible/importFromXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromXML } from "~/metadata/forms/elements/baseElement/importFromXML"
import { importChildItemsFromXML } from "~/metadata/forms/elements/childItems/importFromXML"
import { importContextMenuFromXML } from "~/metadata/forms/elements/contextMenu/importFromXML"
import { importFormDecorationFromXML } from "~/metadata/forms/elements/formDecoration/importFromXML"
import { FormItemAddition, FormItemAdditionXML } from "~/metadata/forms/elements/formItemAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"

export const importFormItemAdditionFromXML = (
  context: ConfigurationContext,
  xml: FormItemAdditionXML | undefined
): FormItemAddition | undefined => {
  if (!xml) return undefined
  const baseFields = importBaseElementFromXML(context, xml)
  if (!baseFields) return undefined

  const { elementType: _, ...restFields } = baseFields

  const result: FormItemAddition = {
    elementType: FormElementType.FormItemAddition,
    ...restFields,
  }

  const childItems = importChildItemsFromXML(context, xml.ChildItems)
  result.childItems = childItems

  const contextMenu = importContextMenuFromXML(context, xml.ContextMenu, result)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  if (xml._DisplayImportance !== undefined) result.displayImportance = xml._DisplayImportance

  if (xml.Enabled !== undefined) result.enabled = xml.Enabled

  const extendedToolTip = importFormDecorationFromXML(context, xml.ExtendedToolTip)
  if (extendedToolTip !== undefined) result.extendedToolTip = extendedToolTip

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

  return result
}

registerMetadata("ImportFromXML", "FormItemAddition", importFormItemAdditionFromXML)
