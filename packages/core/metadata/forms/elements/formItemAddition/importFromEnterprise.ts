import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importBaseElementFromEnterprise } from "~/metadata/forms/elements/baseElement/importFromEnterprise"
import { importChildItemsFromEnterprise } from "~/metadata/forms/elements/childItems/importFromEnterprise"
import { importCommandBarFromEnterprise } from "~/metadata/forms/elements/commandBar/importFromEnterprise"
import { importFormDecorationFromEnterprise } from "~/metadata/forms/elements/formDecoration/importFromEnterprise"
import { FormItemAddition, FormItemAdditionEnterprise } from "~/metadata/forms/elements/formItemAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importFormItemAdditionFromEnterprise = (
  context: ConfigurationContext,
  data: FormItemAdditionEnterprise | undefined,
  name: string
): FormItemAddition | undefined => {
  if (!data) return undefined

  const baseFields = importBaseElementFromEnterprise(context, {}, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: FormItemAddition = {
    elementType: FormElementType.FormItemAddition,
    ...restFields,
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

  const contextMenu = importCommandBarFromEnterprise(context, data.КонтекстноеМеню, name + ".КонтекстноеМеню")
  if (contextMenu !== undefined) result.contextMenu = contextMenu

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const childItems = importChildItemsFromEnterprise(context, data.ПодчиненныеЭлементы, name)
  if (childItems !== undefined) result.childItems = childItems

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  const extendedToolTip = importFormDecorationFromEnterprise(context, data.РасширеннаяПодсказка, name + ".РасширеннаяПодсказка")
  if (extendedToolTip !== undefined) result.extendedToolTip = extendedToolTip

  return result
}

registerMetadata("ImportFromEnterprise", "FormItemAddition", importFormItemAdditionFromEnterprise)

