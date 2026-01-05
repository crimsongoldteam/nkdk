import { exportBooleanToEnterprise } from "~/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar, CommandBarEnterprise } from "~/metadata/forms/elements/commandBar/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportCommandBarToEnterprise = (
  context: ConfigurationContext,
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
