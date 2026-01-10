import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportI8nTextToEnterprise } from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportBaseElementToEnterprise } from "~/metadata/forms/elements/baseElement/exportToEnterprise"
import { exportChildItemsToEnterprise } from "~/metadata/forms/elements/childItems/exportToEnterprise"
import { exportContextMenuToEnterprise } from "~/metadata/forms/elements/contextMenu/exportToEnterprise"
import { FormItemAddition, FormItemAdditionEnterprise } from "~/metadata/forms/elements/formItemAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { exportExtendedTooltipToEnterprise } from "../extendedTooltip/exportToEnterprise"

export const exportFormItemAdditionToEnterprise = (
  context: ConfigurationContext,
  data: FormItemAddition | undefined
): FormItemAdditionEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportBaseElementToEnterprise(context, data)

  const result: FormItemAdditionEnterprise = {
    ...baseFields,
  }

  const displayImportance = exportSystemEnumerationToEnterprise(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const verticalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlignInGroup,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.ВертикальноеПоложениеВГруппе = verticalAlignInGroup

  const type = exportSystemEnumerationToEnterprise(context, data.type, SE.FormItemAdditionTypeToEnterprise)
  if (type !== undefined) result.Вид = type

  const visible = exportBooleanToEnterprise(context, data.visible)
  if (visible !== undefined) result.Видимость = visible

  const horizontalAlignInGroup = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlignInGroup,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.ГоризонтальноеПоложениеВГруппе = horizontalAlignInGroup

  const enabled = exportBooleanToEnterprise(context, data.enabled)
  if (enabled !== undefined) result.Доступность = enabled

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  const contextMenu = exportContextMenuToEnterprise(context, data.contextMenu)
  if (contextMenu !== undefined) result.КонтекстноеМеню = contextMenu

  const toolTipRepresentation = exportSystemEnumerationToEnterprise(
    context,
    data.toolTipRepresentation,
    SE.ToolTipRepresentationToEnterprise
  )
  if (toolTipRepresentation !== undefined) result.ОтображениеПодсказки = toolTipRepresentation

  const toolTip = exportI8nTextToEnterprise(context, data.toolTip)
  if (toolTip !== undefined) result.Подсказка = toolTip

  const childItems = exportChildItemsToEnterprise(context, data.childItems)
  if (childItems !== undefined) result.ПодчиненныеЭлементы = childItems

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const extendedToolTip = exportExtendedTooltipToEnterprise(context, data.extendedTooltip)
  if (extendedToolTip !== undefined) result.РасширеннаяПодсказка = extendedToolTip

  return result
}

registerMetadata("ExportToEnterprise", "FormItemAddition", exportFormItemAdditionToEnterprise)
