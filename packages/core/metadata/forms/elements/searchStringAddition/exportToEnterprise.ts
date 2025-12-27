import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { exportFormItemAdditionToEnterprise } from "~/metadata/forms/elements/formItemAddition/exportToEnterprise"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
} from "~/metadata/forms/elements/searchStringAddition/types"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"

export const exportSearchStringAdditionToEnterprise = (
  context: Context,
  data: SearchStringAddition | undefined
): SearchStringAdditionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToEnterprise(context, data)!,

    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(context, data.font),
  })
}

registerMetadata("ExportToEnterprise", "SearchStringAddition", exportSearchStringAdditionToEnterprise)
