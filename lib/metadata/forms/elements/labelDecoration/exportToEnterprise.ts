import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportBorderToEnterprise } from "~/lib/metadata/commonObjects/border/exportToEnterprise"
import { exportColorToEnterprise } from "~/lib/metadata/commonObjects/color/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { exportFormDecorationToEnterprise } from "~/lib/metadata/forms/elements/formDecoration/exportToEnterprise"
import { LabelDecoration, LabelDecorationEnterprise } from "~/lib/metadata/forms/elements/labelDecoration/types"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportEventsToEnterprise } from "~/lib/metadata/forms/events/exportToEnterprise"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportLabelDecorationToEnterprise = (
  data: LabelDecoration | undefined
): LabelDecorationEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormDecorationToEnterprise(data)!,

    ЦветФона: exportColorToEnterprise(data.backColor),
    Рамка: exportBorderToEnterprise(data.border),
    ЦветРамки: exportColorToEnterprise(data.borderColor),
    ВертикальноеВыравниваниеГруппы: exportSystemEnumerationToEnterprise(
      data.groupVerticalAlign,
      SE.ItemVerticalAlignToEnterprise
    ),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    Гиперссылка: exportBooleanToEnterprise(data.hyperlink),
    ВысотаЗаголовка: data.titleHeight,
    ВертикальноеПоложение: exportSystemEnumerationToEnterprise(data.verticalAlign, SE.ItemVerticalAlignToEnterprise),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
    Events: exportEventsToEnterprise(data.events),
  }
}

registerEnterpriseExport(FormElementType.LabelDecoration, exportLabelDecorationToEnterprise)
