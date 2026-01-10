import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromEnterprise } from "~/metadata/forms/elements/baseElement/importFromEnterprise"
import { importChildItemsFromEnterprise } from "~/metadata/forms/elements/childItems/importFromEnterprise"
import { importContextMenuFromEnterprise } from "~/metadata/forms/elements/contextMenu/importFromEnterprise"
import { FormItemAddition, FormItemAdditionEnterprise } from "~/metadata/forms/elements/formItemAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "../types"

export const importFormItemAdditionFromEnterprise = <
  T extends FormItemAdditionEnterprise | undefined,
  N extends string | undefined,
>(
  context: ConfigurationContext,
  data: T,
  name: N
): ImportFromEnterpriseReturn<T, FormItemAddition, N> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<T, FormItemAddition, N>

  const baseFields = importBaseElementFromEnterprise(context, data, name)

  const result: ImportFromEnterpriseReturn<T, FormItemAddition, N> = {
    ...baseFields,
    elementType: FormElementType.FormItemAddition,
  }

  const displayImportance = importSystemEnumerationFromEnterprise<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromEnterprise<SE.FormItemAdditionType>(
    context,
    data.Вид,
    SE.FormItemAdditionTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, data.Видимость)
  if (visible !== undefined) result.visible = visible

  const horizontalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const enabled = importBooleanFromEnterprise(context, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  const contextMenu = importContextMenuFromEnterprise(context, data.КонтекстноеМеню)
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const childItems = importChildItemsFromEnterprise(context, data.ПодчиненныеЭлементы)
  if (childItems !== undefined) result.childItems = childItems

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const extendedToolTip = importExtendedTooltipFromEnterprise(context, data.РасширеннаяПодсказка)
  if (extendedToolTip !== undefined) result.extendedTooltip = extendedToolTip

  return result
}

registerMetadata("ImportFromEnterprise", "FormItemAddition", importFormItemAdditionFromEnterprise)
