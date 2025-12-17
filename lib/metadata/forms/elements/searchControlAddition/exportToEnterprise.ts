import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormItemAdditionToEnterprise } from "~/lib/metadata/forms/elements/formItemAddition/exportToEnterprise"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
} from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"

export const exportSearchControlAdditionToEnterprise = (
  data: SearchControlAddition | undefined
): SearchControlAdditionEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormItemAdditionToEnterprise(data)!,

    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(data.autoMaxWidth),
    ЦветФона: exportColorToEnterprise(data.backColor),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    Шрифт: exportFontToEnterprise(data.font),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    МаксимальнаяШирина: data.maxWidth,
    ЦветТекста: exportColorToEnterprise(data.textColor),
    Ширина: data.width,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.SearchControlAddition, exportSearchControlAdditionToEnterprise)
