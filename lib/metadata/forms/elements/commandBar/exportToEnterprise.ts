import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { CommandBar, CommandBarEnterprise } from "~/lib/metadata/forms/elements/commandBar/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportCommandBarToEnterprise = (data: CommandBar | undefined): CommandBarEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToEnterprise(data)!,

    Автозаполнение: exportBooleanToEnterprise(data.autofill),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.CommandBar, exportCommandBarToEnterprise)
