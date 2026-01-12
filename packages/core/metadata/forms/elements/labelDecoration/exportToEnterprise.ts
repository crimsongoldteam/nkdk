import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import {
  exportI8nTextOtherToEnterprise,
  exportI8nTextToEnterprise,
} from "~/metadata/commonObjects/i8nText/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormDecorationPropsToEnterprise } from "~/metadata/forms/elements/formDecoration/exportToEnterprise"
import {
  LabelDecoration,
  LabelDecorationPartialEnterprise,
  LabelDecorationTypedEnterprise,
} from "~/metadata/forms/elements/labelDecoration/types"
import { sortObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

const exportLabelDecorationEventsToEnterprise = (
  data: { click?: string; uRLProcessing?: string } | undefined
): { Нажатие?: string; ОбработкаНавигационнойСсылки?: string } | undefined => {
  if (!data) return undefined

  const result: { Нажатие?: string; ОбработкаНавигационнойСсылки?: string } = {}

  if (data.click !== undefined) {
    result.Нажатие = data.click
  }

  if (data.uRLProcessing !== undefined) {
    result.ОбработкаНавигационнойСсылки = data.uRLProcessing
  }

  return Object.keys(result).length > 0 ? result : undefined
}

export const exportLabelDecorationTypedToEnterprise = (
  context: ConfigurationContext,
  data: LabelDecoration | undefined
): LabelDecorationTypedEnterprise | undefined => {
  if (!data) return undefined

  const props = exportLabelDecorationPropsToEnterprise(context, data)

  const result: LabelDecorationTypedEnterprise = {
    Тип: "Надпись",
    ...props,
  }

  const title = exportI8nTextToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

export const exportLabelDecorationPartialToEnterprise = (
  context: ConfigurationContext,
  data: LabelDecoration
): LabelDecorationPartialEnterprise => {
  const props = exportLabelDecorationPropsToEnterprise(context, data)

  const result: LabelDecorationPartialEnterprise = {
    ...props,
  }

  const title = exportI8nTextOtherToEnterprise(context, data.title)
  if (title !== undefined) result.Заголовок = title

  return sortObject(result)
}

const exportLabelDecorationPropsToEnterprise = (
  context: ConfigurationContext,
  data: LabelDecoration
): LabelDecorationPartialEnterprise => {
  const baseFields = exportFormDecorationPropsToEnterprise(context, data)

  const result: LabelDecorationPartialEnterprise = {
    ...baseFields,
  }

  const verticalAlignGroup = exportSystemEnumerationToEnterprise(
    context,
    data.groupVerticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlignGroup !== undefined) result.ВертикальноеВыравниваниеГруппы = verticalAlignGroup

  const verticalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.verticalAlign,
    SE.ItemVerticalAlignToEnterprise
  )
  if (verticalAlign !== undefined) result.ВертикальноеПоложение = verticalAlign

  if (data.titleHeight !== undefined) result.ВысотаЗаголовка = data.titleHeight

  const hyperlink = exportBooleanToEnterprise(context, data.hyperlink)
  if (hyperlink !== undefined) result.Гиперссылка = hyperlink

  const horizontalAlign = exportSystemEnumerationToEnterprise(
    context,
    data.horizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const border = exportBorderToEnterprise(context, data.border)
  if (border !== undefined) result.Рамка = border

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const backColor = exportColorToEnterprise(context, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  const events = exportLabelDecorationEventsToEnterprise(data.events)
  if (events !== undefined) result.События = events

  return result
}

registerMetadata("ExportPartialToEnterprise", "LabelDecoration", exportLabelDecorationPartialToEnterprise)
