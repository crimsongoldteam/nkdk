import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importBorderFromEnterprise } from "~/metadata/commonObjects/border/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import {
  importI8nTextCombinedFromEnterprise,
  importI8nTextFromEnterprise,
} from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import {
  LabelDecoration,
  LabelDecorationPartialEnterprise,
  LabelDecorationTypedEnterprise,
} from "~/metadata/forms/elements/labelDecoration/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import {
  importFormElementTypeFromEnterprise,
  ToPartialEnterpriseType,
  ToTypedEnterpriseType,
} from "~/metadata/metadataFactory/types"
import { ImportExportReturn } from "../types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importFormDecorationPropsFromEnterprise } from "../formDecoration/importFromEnterprise"

const importLabelDecorationEventsFromEnterprise = (
  data: { Нажатие?: string; ОбработкаНавигационнойСсылки?: string } | undefined
) => {
  if (!data) return undefined

  const result: { click?: string; uRLProcessing?: string } = {}

  if (data.Нажатие !== undefined) {
    result.click = data.Нажатие
  }

  if (data.ОбработкаНавигационнойСсылки !== undefined) {
    result.uRLProcessing = data.ОбработкаНавигационнойСсылки
  }

  return Object.keys(result).length > 0 ? result : undefined
}

export function importLabelDecorationTypedFromEnterprise<To extends LabelDecoration | undefined>(
  context: ConfigurationContext,
  data: ToTypedEnterpriseType<To>,
  name: string
): ImportExportReturn<ToTypedEnterpriseType<To>, To> {
  if (data === undefined) return undefined

  const props = importLabelDecorationPropsFromEnterprise(context, data)

  const elementType = importFormElementTypeFromEnterprise(context, data.Тип)

  const result: LabelDecoration = {
    ...props,
    elementType,
    name,
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

  return result as ImportExportReturn<ToTypedEnterpriseType<To>, To>
}

export function importLabelDecorationPartialFromEnterprise<To extends LabelDecoration>(
  context: ConfigurationContext,
  source: To,
  data: ToPartialEnterpriseType<To> | undefined
): To {
  const props = importLabelDecorationPropsFromEnterprise(context, data)
  const result: To = {
    ...source,
    ...props,
  }

  const title = importI8nTextCombinedFromEnterprise(context, source.title, data?.Заголовок)
  if (title !== undefined) result.title = title

  return result
}

const importLabelDecorationPropsFromEnterprise = (
  context: ConfigurationContext,
  data: LabelDecorationTypedEnterprise | LabelDecorationPartialEnterprise | undefined
): Omit<Partial<LabelDecoration>, "elementType" | "name"> => {
  const result: Omit<Partial<LabelDecoration>, "elementType" | "name"> = {}

  if (data === undefined) return result

  const baseProps = importFormDecorationPropsFromEnterprise(context, data)
  Object.assign(result, baseProps)

  const groupVerticalAlign = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеВыравниваниеГруппы,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (groupVerticalAlign !== undefined) result.groupVerticalAlign = groupVerticalAlign

  const verticalAlign = importSystemEnumerationFromEnterprise<SE.ItemVerticalAlign>(
    context,
    data.ВертикальноеПоложение,
    SE.ItemVerticalAlignFromEnterprise
  )
  if (verticalAlign !== undefined) result.verticalAlign = verticalAlign

  if (data.ВысотаЗаголовка !== undefined) result.titleHeight = data.ВысотаЗаголовка

  const hyperlink = importBooleanFromEnterprise(context, data.Гиперссылка)
  if (hyperlink !== undefined) result.hyperlink = hyperlink

  const horizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

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

  const border = importBorderFromEnterprise(context, data.Рамка)
  if (border !== undefined) result.border = border

  const borderColor = importColorFromEnterprise(context, data.ЦветРамки)
  if (borderColor !== undefined) result.borderColor = borderColor

  const backColor = importColorFromEnterprise(context, data.ЦветФона)
  if (backColor !== undefined) result.backColor = backColor

  const events = importLabelDecorationEventsFromEnterprise(data.События)
  if (events !== undefined) result.events = events

  return result
}

registerMetadata("ImportPartialFromEnterprise", "LabelDecoration", importLabelDecorationPropsFromEnterprise)
