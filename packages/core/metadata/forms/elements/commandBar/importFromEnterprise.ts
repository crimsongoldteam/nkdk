import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar } from "~/metadata/forms/elements/commandBar/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { ImportPartialFromEnterpriseFn, ToPartialEnterpriseType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChildItemsPartialFromEnterprise } from "../../collections/childItems/importFromEnterprise"

export function importCommandBarPartialFromEnterprise<To extends CommandBar>(
  context: ConfigurationContext,
  structure: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  if (!data && !structure) return undefined as unknown as To

  const result: To = {
    ...structure,
    childItems: structure.childItems ?? [],
  }

  const title = importI8nTextCombinedFromEnterprise(context, structure.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  if (!data) return result

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromEnterprise<SE.FormGroupType>(
    context,
    data.Вид,
    SE.FormGroupTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const enabled = importBooleanFromEnterprise(context, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const enableContentChange = importBooleanFromEnterprise(context, data.РазрешитьИзменениеСостава)
  if (enableContentChange !== undefined) result.enableContentChange = enableContentChange

  const verticalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const readOnly = importBooleanFromEnterprise(context, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const titleTextColor = importColorFromEnterprise(context, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const titleFont = importFontFromEnterprise(context, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const autofill = importBooleanFromEnterprise(context, data.Автозаполнение)
  if (autofill !== undefined) result.autofill = autofill

  const displayImportance = importSystemEnumerationFromEnterprise<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const horizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

  const userVisible = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const childItems = importChildItemsPartialFromEnterprise(context, structure?.childItems ?? [])
  if (childItems !== undefined) result.childItems = childItems

  return result
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "CommandBar",
  importCommandBarPartialFromEnterprise as ImportPartialFromEnterpriseFn
)
