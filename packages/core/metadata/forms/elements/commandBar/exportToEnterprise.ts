import { exportBooleanToEnterprise } from "~/packages/core/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { CommandBar, CommandBarEnterprise } from "~/packages/core/metadata/forms/elements/commandBar/types"
import { exportFormGroupToEnterprise } from "~/packages/core/metadata/forms/elements/formGroup/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export const exportCommandBarToEnterprise = (
  context: Context,
  data: CommandBar | undefined
): CommandBarEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(context, data)!,

    Автозаполнение: exportBooleanToEnterprise(context, data.autofill),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      context,
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      context,
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
  })
}

registerMetadata("ExportToEnterprise", "CommandBar", exportCommandBarToEnterprise)
