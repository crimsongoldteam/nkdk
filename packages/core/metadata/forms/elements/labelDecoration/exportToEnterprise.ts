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

  return {
    const baseFields = exportFormDecorationToEnterprise(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

    ВертикальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(
      context,
      data.groupVerticalAlign,
      SE.ItemVerticalAlignToEnterprise
    ),
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(
      context,
      data.verticalAlign,
      SE.ItemVerticalAlignToEnterprise
    ),
    ВысотаЗаголовка: data.titleHeight,
    Гиперссылка: exportBooleanToEnterprise(context, data.hyperlink),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    Рамка: exportBorderToEnterprise(context, data.border),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    События: exportLabelDecorationEventsToEnterprise(data.events),  }
}

registerMetadata("ExportToEnterprise", "LabelDecoration", exportLabelDecorationToEnterprise)
