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
import { PropertyRule } from "../calendarField/rules"
import { importExtendedTooltipFromEnterprise } from "../extendedTooltip/importFromEnterprise"

export function importPagesTypedFromEnterprise<To extends Pages | undefined>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: ToTypedEnterpriseType<To>,
  name: string
): To {
  if (data === undefined) return undefined as To

  const props = importPagesPropsFromEnterprise(context, undefined, data)

  const result: Pages = {
    ...props,
    elementType: "Pages",
    name,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextFromEnterprise(context, { type: "I8nText" }, data.Заголовок)
  if (title !== undefined) result.title = title

  return result as To
}

export function importPagesPartialFromEnterprise<To extends Pages>(
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importPagesPropsFromEnterprise(context, undefined, data)
  const result: To = {
    ...source,
    ...props,
    childItems: source.childItems ?? [],
  }

  const title = importI8nTextCombinedFromEnterprise(context, undefined, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importPagesPropsFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule<any>,
  data: PagesTypedEnterprise | PagesPartialEnterprise | undefined
): Omit<Partial<Pages>, "elementType" | "name"> => {
  const result: Omit<Partial<Pages>, "elementType" | "name"> = {
    childItems: [],
  }

  if (data === undefined) return result

  const verticalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    undefined,
    data.ВертикальноеПоложениеВГруппе,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlignInGroup !== undefined) result.verticalAlignInGroup = verticalAlignInGroup

  const type = importSystemEnumerationFromEnterprise<SE.FormGroupType>(
    context,
    undefined,
    data.Вид,
    SE.FormGroupTypeFromEnterprise
  )
  if (type !== undefined) result.type = type

  const visible = importBooleanFromEnterprise(context, undefined, data.Видимость)
  if (visible !== undefined) result.visible = visible

  if (data.Высота !== undefined) result.height = data.Высота

  const horizontalAlignInGroup = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    undefined,
    data.ГоризонтальноеПоложениеВГруппе,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlignInGroup !== undefined) result.horizontalAlignInGroup = horizontalAlignInGroup

  const enabled = importBooleanFromEnterprise(context, undefined, data.Доступность)
  if (enabled !== undefined) result.enabled = enabled

  const toolTipRepresentation = importSystemEnumerationFromEnterprise<SE.ToolTipRepresentation>(
    context,
    undefined,
    data.ОтображениеПодсказки,
    SE.ToolTipRepresentationFromEnterprise
  )
  if (toolTipRepresentation !== undefined) result.toolTipRepresentation = toolTipRepresentation

  const toolTip = importI8nTextFromEnterprise(context, { type: "I8nText" }, data.Подсказка)
  if (toolTip !== undefined) result.toolTip = toolTip

  const enableContentChange = importBooleanFromEnterprise(context, undefined, data.РазрешитьИзменениеСостава)
  if (enableContentChange !== undefined) result.enableContentChange = enableContentChange

  const verticalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоВертикали)
  if (verticalStretch !== undefined) result.verticalStretch = verticalStretch

  const horizontalStretch = importBooleanFromEnterprise(context, undefined, data.РастягиватьПоГоризонтали)
  if (horizontalStretch !== undefined) result.horizontalStretch = horizontalStretch

  const extendedTooltip = importExtendedTooltipFromEnterprise(context, undefined, data.РасширеннаяПодсказка)
  if (extendedTooltip !== undefined) result.extendedTooltip = extendedTooltip

  if (data.СочетаниеКлавиш !== undefined) result.shortcut = data.СочетаниеКлавиш

  const readOnly = importBooleanFromEnterprise(context, undefined, data.ТолькоПросмотр)
  if (readOnly !== undefined) result.readOnly = readOnly

  const titleTextColor = importColorFromEnterprise(context, undefined, data.ЦветТекстаЗаголовка)
  if (titleTextColor !== undefined) result.titleTextColor = titleTextColor

  if (data.Ширина !== undefined) result.width = data.Ширина

  const titleFont = importFontFromEnterprise(context, undefined, data.ШрифтЗаголовка)
  if (titleFont !== undefined) result.titleFont = titleFont

  const currentRowUse = importSystemEnumerationFromEnterprise<SE.CurrentRowUse>(
    context,
    undefined,
    data.ИспользованиеТекущейСтроки,
    SE.CurrentRowUseFromEnterprise
  )
  if (currentRowUse !== undefined) result.currentRowUse = currentRowUse

  const pagesRepresentation = importSystemEnumerationFromEnterprise<SE.FormPagesRepresentation>(
    context,
    undefined,
    data.ОтображениеСтраниц,
    SE.FormPagesRepresentationFromEnterprise
  )
  if (pagesRepresentation !== undefined) result.pagesRepresentation = pagesRepresentation

  const userVisible = importUserVisibleFromEnterprise(
    context,
    undefined,
    data.РазрешитьИспользование,
    data.ЗапретитьИспользование
  )
  if (userVisible !== undefined) {
    result.userVisible = userVisible
  }

  const currentPagesState = importSystemEnumerationFromEnterprise<SE.FormPagesState>(
    context,
    undefined,
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
