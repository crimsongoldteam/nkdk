import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { importFormGroupPropsFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { Pages, PagesPartialEnterprise, PagesTypedEnterprise } from "~/metadata/forms/elements/pages/types"
import { importTableFromEnterprise } from "~/metadata/forms/elements/table/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { importFormElementTypeFromEnterprise } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importPagesTypedFromEnterprise = (
  context: ConfigurationContext,
  data: PagesTypedEnterprise | undefined,
  name: string
): Pages | undefined => {
  if (data === undefined) return undefined

  const baseProps = importFormGroupPropsFromEnterprise(context, data)
  const props = importPagesPropsFromEnterprise(context, data, name)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: Pages = {
    ...baseProps,
    ...props,
    elementType,
    name,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

export const importPagesPartialFromEnterprise = (
  context: ConfigurationContext,
  source: Pages | undefined,
  data: PagesPartialEnterprise | undefined
): Pages | undefined => {
  if (source === undefined) return undefined

  const baseProps = importFormGroupPropsFromEnterprise(context, data)
  const props = importPagesPropsFromEnterprise(context, data, source.name)
  const result: Pages = {
    ...source,
    ...baseProps,
    ...props,
    childItems: props.childItems ?? [],
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importPagesPropsFromEnterprise = (
  context: ConfigurationContext,
  data: PagesTypedEnterprise | PagesPartialEnterprise | undefined,
  name: string
): Omit<Partial<Pages>, "elementType" | "name"> => {
  const result: Omit<Partial<Pages>, "elementType" | "name"> = {
    childItems: [],
  }

  if (data === undefined) return result

  const currentRowUse = importSystemEnumerationFromEnterprise<SE.CurrentRowUse>(
    context,
    data.ИспользованиеТекущейСтроки,
    SE.CurrentRowUseFromEnterprise
  )
  if (currentRowUse !== undefined) result.currentRowUse = currentRowUse

  const associatedTable = importTableFromEnterprise(context, data.ИспользуемаяТаблица, name + ".ИспользуемаяТаблица")
  if (associatedTable !== undefined) result.associatedTable = associatedTable

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

registerMetadata("ImportPartialFromEnterprise", "Pages", importPagesPropsFromEnterprise)
