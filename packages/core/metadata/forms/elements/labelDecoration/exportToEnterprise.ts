import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormDecorationToEnterprise } from "~/metadata/forms/elements/formDecoration/exportToEnterprise"
import { LabelDecoration, LabelDecorationEnterprise } from "~/metadata/forms/elements/labelDecoration/types"
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

export const exportLabelDecorationToEnterprise = (
  context: ConfigurationContext,
  data: LabelDecoration | undefined
): LabelDecorationEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormDecorationToEnterprise(context, data)

  const result: LabelDecorationEnterprise = {
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

registerMetadata("ExportToEnterprise", "LabelDecoration", exportLabelDecorationToEnterprise)
