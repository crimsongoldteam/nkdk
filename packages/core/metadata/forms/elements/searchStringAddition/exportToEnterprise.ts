import { exportBooleanToEnterprise } from "~/packages/core/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/packages/core/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/packages/core/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormItemAdditionToEnterprise } from "~/packages/core/metadata/forms/elements/formItemAddition/exportToEnterprise"
import {
  SearchStringAddition,
  SearchStringAdditionEnterprise,
} from "~/packages/core/metadata/forms/elements/searchStringAddition/types"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"

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
