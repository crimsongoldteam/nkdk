import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/metadata/context/types"
import { exportFormDecorationToEnterprise } from "~/metadata/forms/elements/formDecoration/exportToEnterprise"
import { LabelDecoration, LabelDecorationEnterprise } from "~/metadata/forms/elements/labelDecoration/types"
import { exportEventsToEnterprise } from "~/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

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
