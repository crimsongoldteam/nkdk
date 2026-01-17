import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importFontFromEnterprise } from "~/metadata/commonObjects/font/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { Pages, PagesPartialEnterprise, PagesTypedEnterprise } from "~/metadata/forms/elements/pages/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  ImportPartialFromEnterpriseFn,
  ImportTypedFromEnterpriseFn,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"

export function importPagesTypedFromEnterprise<To extends Pages | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importPagesPropsFromEnterprise(context, data)

  const result: Pages = {
    ...props,
    elementType: "Pages",
    name,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importPagesPartialFromEnterprise<To extends Pages>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importPagesPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...props,
    childItems: source.childItems ?? [],
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importPagesPropsFromEnterprise = (
  context: ConfigurationContext,
  data: PagesTypedEnterprise | PagesPartialEnterprise | undefined
): Omit<Partial<Pages>, "elementType" | "name"> => {
  const result: Omit<Partial<Pages>, "elementType" | "name"> = {
    childItems: [],
  }

  if (data === undefined) return result

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

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const readOnly = importBooleanFromEnterprise(context, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const titleTextColor = importColorFromEnterprise(context, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const titleFont = importFontFromEnterprise(context, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const currentRowUse = importSystemEnumerationFromEnterprise<SE.CurrentRowUse>(
    context,
    data.ИспользованиеТекущейСтроки,
    SE.CurrentRowUseFromEnterprise
  )
  if (currentRowUse !== undefined) result.currentRowUse = currentRowUse

  const pagesRepresentation = importSystemEnumerationFromEnterprise<SE.FormPagesRepresentation>(
    context,
    data.ОтображениеСтраниц,
    SE.FormPagesRepresentationFromEnterprise
  )
  if (pagesRepresentation !== undefined) result.pagesRepresentation = pagesRepresentation

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

  const currentPagesState = importSystemEnumerationFromEnterprise<SE.FormPagesState>(
    context,
    data.ТекущееСостояниеСтраниц,
    SE.FormPagesStateFromEnterprise
  )
  if (currentPagesState !== undefined) result.currentPagesState = currentPagesState

  const events = importPagesEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

const importPagesEventsFromEnterprise = (
  data:
    | {
        ПриСменеСтраницы?: string
      }
    | undefined
):
  | {
      onCurrentPageChange?: string
    }
  | undefined => {
  if (!data) return undefined

  const result: {
    onCurrentPageChange?: string
  } = {}

  if (data.ПриСменеСтраницы !== undefined) result.onCurrentPageChange = data.ПриСменеСтраницы

  return Object.keys(result).length > 0 ? result : undefined
}

registerMetadata(
  "ImportPartialFromEnterprise",
  "Pages",
  importPagesPartialFromEnterprise as ImportPartialFromEnterpriseFn
)

registerMetadata("ImportTypedFromEnterprise", "Pages", importPagesTypedFromEnterprise as ImportTypedFromEnterpriseFn)
