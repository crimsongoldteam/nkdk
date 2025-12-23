import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { CommandBar, CommandBarEnterprise } from "~/lib/metadata/forms/elements/commandBar/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportCommandBarToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: CommandBar | undefined
): CommandBarEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(configurationSettings, data)!,

    Автозаполнение: exportBooleanToEnterprise(configurationSettings, data.autofill),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.displayImportance,
      SE.DisplayImportanceToEnterprise
    ),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      configurationSettings,
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
  })
}

registerMetadata("ExportToEnterprise", "CommandBar", exportCommandBarToEnterprise)
