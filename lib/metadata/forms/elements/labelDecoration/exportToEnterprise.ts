import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/lib/metadata/context/types"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { LabelDecoration, LabelDecorationEnterprise } from "~/lib/metadata/forms/elements/labelDecoration/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

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
