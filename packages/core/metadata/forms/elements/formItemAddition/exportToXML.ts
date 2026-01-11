import { exportI8nTextToXML } from "~/metadata/commonObjects/i8nText/exportToXML"
import { exportUserVisibleToXML } from "~/metadata/commonObjects/userVisible/exportToXML"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportChildItemsToXML } from "~/metadata/forms/collections/childItems/exportToXML"
import { exportBaseElementToXML } from "~/metadata/forms/elements/baseElement/exportToXML"
import { exportContextMenuToXML } from "~/metadata/forms/elements/contextMenu/exportToXML"
import { FormItemAddition, FormItemAdditionXML } from "~/metadata/forms/elements/formItemAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportExtendedTooltipToXML } from "../extendedTooltip/exportToXML"

export const exportFormItemAdditionToXML = (
  context: ConfigurationContext,
  data: FormItemAddition | undefined
): FormItemAdditionXML | undefined => {
  if (!data) return undefined

  const baseFields = exportBaseElementToXML(context, data)
  if (!baseFields) return undefined

  const result: FormItemAdditionXML = {
    ...baseFields,
  }

  const childItems = exportChildItemsToXML(context, data.childItems)
  if (childItems !== undefined) result.ChildItems = childItems

  const contextMenu = exportContextMenuToXML(context, data.contextMenu, data)
  if (contextMenu !== undefined) result.ContextMenu = contextMenu

  if (data.displayImportance !== undefined) result._DisplayImportance = data.displayImportance

  if (data.enabled !== undefined) result.Enabled = data.enabled

  result.ExtendedTooltip = exportExtendedTooltipToXML(context, data.extendedTooltip, data)

  if (data.horizontalAlignInGroup !== undefined) result.HorizontalAlignInGroup = data.horizontalAlignInGroup

  const title = exportI8nTextToXML(context, data.title)
  if (title !== undefined) result.Title = title

  const toolTip = exportI8nTextToXML(context, data.toolTip)
  if (toolTip !== undefined) result.ToolTip = toolTip

  if (data.toolTipRepresentation !== undefined) result.ToolTipRepresentation = data.toolTipRepresentation

  if (data.type !== undefined) result.Type = data.type

  const userVisible = exportUserVisibleToXML(context, data.userVisible)
  if (userVisible !== undefined) result.UserVisible = userVisible

  if (data.verticalAlignInGroup !== undefined) result.VerticalAlignInGroup = data.verticalAlignInGroup

  if (data.visible !== undefined) result.Visible = data.visible

  return result
}

registerMetadata("ExportToXML", "FormItemAddition", exportFormItemAdditionToXML)
