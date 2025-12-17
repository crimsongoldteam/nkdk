import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormItemAdditionToEnterprise } from "~/lib/metadata/forms/elements/formItemAddition/exportToEnterprise"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
} from "~/lib/metadata/forms/elements/searchStringAddition/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"

export const exportSearchStringAdditionToEnterprise = (
  data: SearchStringAddition | undefined
): SearchStringAdditionEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormItemAdditionToEnterprise(data)!,

    ЦветФона: exportColorToEnterprise(data.backColor),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    Шрифт: exportFontToEnterprise(data.font),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(data.horizontalStretch),
    ЦветТекста: exportColorToEnterprise(data.textColor),
    Ширина: data.width,
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.SearchStringAddition, exportSearchStringAdditionToEnterprise)
