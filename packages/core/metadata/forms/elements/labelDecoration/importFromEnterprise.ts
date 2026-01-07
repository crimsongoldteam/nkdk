import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importColorFromEnterprise } from "~/metadata/commonObjects/color/importFromEnterprise"
import { importI8nTextFromEnterprise } from "~/metadata/commonObjects/i8nText/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { LabelDecoration, LabelDecorationEnterprise } from "~/metadata/forms/elements/labelDecoration/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const importBorderFromEnterprise = (
  context: ConfigurationContext,
  data: { Имя?: string; Ширина?: number; ТипРамки?: SE.ControlBorderTypeEnterprise } | undefined
) => {
  if (!data) return undefined

  const result: { ref?: string; width?: number; controlBorderType?: SE.ControlBorderType } = {}

  if (data.Имя !== undefined) {
    result.ref = data.Имя
  }

  if (data.Ширина !== undefined) {
    result.width = data.Ширина
  }

  const controlBorderType = importSystemEnumerationFromEnterprise<SE.ControlBorderType>(
    context,
    data.ТипРамки,
    SE.ControlBorderTypeFromEnterprise
  )
  if (controlBorderType !== undefined) {
    result.controlBorderType = controlBorderType
  }

  return Object.keys(result).length > 0 ? result : undefined
}

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

export const importLabelDecorationFromEnterprise = (
  context: ConfigurationContext,
  data: LabelDecorationEnterprise | undefined,
  name: string
): LabelDecoration | undefined => {
  if (!data) return undefined

  // importFormDecorationFromEnterprise is not implemented yet, so we create base object manually
  const result: LabelDecoration = {
    elementType: FormElementType.LabelDecoration,
    name,
  }

  const title = importI8nTextFromEnterprise(context, data.Заголовок)
  if (title !== undefined) result.title = title

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

registerMetadata("ImportFromEnterprise", "LabelDecoration", importLabelDecorationFromEnterprise)
