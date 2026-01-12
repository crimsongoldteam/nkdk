import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormItemAdditionToEnterprise } from "~/metadata/forms/elements/formItemAddition/exportToEnterprise"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
} from "~/metadata/forms/elements/searchStringAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportSearchStringAdditionToEnterprise = (
  context: ConfigurationContext,
  data: SearchStringAddition | undefined
): SearchStringAdditionEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormItemAdditionToEnterprise(context, data)

  const result: SearchStringAdditionEnterprise = {
    ...baseFields,
  }

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  const horizontalStretch = exportBooleanToEnterprise(context, data.horizontalStretch)
  if (horizontalStretch !== undefined) result.РастягиватьПоГоризонтали = horizontalStretch

  const borderColor = exportColorToEnterprise(context, data.borderColor)
  if (borderColor !== undefined) result.ЦветРамки = borderColor

  const textColor = exportColorToEnterprise(context, data.textColor)
  if (textColor !== undefined) result.ЦветТекста = textColor

  const backColor = exportColorToEnterprise(context, data.backColor)
  if (backColor !== undefined) result.ЦветФона = backColor

  if (data.width !== undefined) result.Ширина = data.width

  const font = exportFontToEnterprise(context, data.font)
  if (font !== undefined) result.Шрифт = font

  return result
}

registerMetadata("ExportPartialToEnterprise", "SearchStringAddition", exportSearchStringAdditionToEnterprise)
