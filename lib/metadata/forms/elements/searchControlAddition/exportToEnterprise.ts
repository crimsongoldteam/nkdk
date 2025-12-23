import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportFontToEnterprise } from "~/lib/metadata/commonObjects/font/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormItemAdditionToEnterprise } from "~/lib/metadata/forms/elements/formItemAddition/exportToEnterprise"
import {
  SearchControlAddition,
  SearchControlAdditionEnterprise,
} from "~/lib/metadata/forms/elements/searchControlAddition/types"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"

export const exportSearchControlAdditionToEnterprise = (
  context: Context,
  data: SearchControlAddition | undefined
): SearchControlAdditionEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormItemAdditionToEnterprise(context, data)!,

    АвтоМаксимальнаяШирина: exportBooleanToEnterprise(context, data.autoMaxWidth),
    МаксимальнаяШирина: data.maxWidth,
    ...exportUserVisibleToEnterprise(context, data.userVisible),
    РастягиватьПоГоризонтали: exportBooleanToEnterprise(context, data.horizontalStretch),
    ЦветРамки: exportColorToEnterprise(context, data.borderColor),
    ЦветТекста: exportColorToEnterprise(context, data.textColor),
    ЦветФона: exportColorToEnterprise(context, data.backColor),
    Ширина: data.width,
    Шрифт: exportFontToEnterprise(context, data.font),
  })
}

registerMetadata("ExportToEnterprise", "SearchControlAddition", exportSearchControlAdditionToEnterprise)
