import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { exportFormItemAdditionToEnterprise } from "~/metadata/forms/elements/formItemAddition/exportToEnterprise"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
} from "~/metadata/forms/elements/searchControlAddition/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportSearchControlAdditionToEnterprise = (
  context: ConfigurationContext,
  data: SearchControlAddition | undefined
): SearchControlAdditionEnterprise | undefined => {
  if (!data) return undefined

  return {
    const baseFields = exportFormItemAdditionToEnterprise(context, data)
  if (!baseFields) return undefined

  return {
    ...baseFields,,

    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(context, data.font),  }
}

registerMetadata("ExportToEnterprise", "SearchControlAddition", exportSearchControlAdditionToEnterprise)
