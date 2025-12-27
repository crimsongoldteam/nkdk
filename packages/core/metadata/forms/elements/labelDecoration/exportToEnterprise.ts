import { exportBooleanToEnterprise } from "~/packages/core/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/packages/core/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/packages/core/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { exportFormDecorationToEnterprise } from "~/packages/core/metadata/forms/elements/formDecoration/exportToEnterprise"
import {
  LabelDecoration,
  LabelDecorationEnterprise,
} from "~/packages/core/metadata/forms/elements/labelDecoration/types"
import { exportEventsToEnterprise } from "~/packages/core/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export const exportLabelDecorationToEnterprise = (
  context: Context,
  data: LabelDecoration | undefined
): LabelDecorationEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormDecorationToEnterprise(context, data)!,

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
    События: exportEventsToEnterprise(context, data.events),
  })
}

registerMetadata("ExportToEnterprise", "LabelDecoration", exportLabelDecorationToEnterprise)
