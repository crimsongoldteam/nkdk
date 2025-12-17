import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { CommandBar, CommandBarEnterprise } from "~/lib/metadata/forms/elements/commandBar/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportCommandBarToEnterprise = (
  data: CommandBar | undefined,
  configurationSettings: ConfigurationSettings
): CommandBarEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToEnterprise(data, configurationSettings)!,

    Автозаполнение: exportBooleanToEnterprise(data.autofill, configurationSettings),
    ВажностьПриОтображении: exportSystemEnumerationToEnterprise(
      data.displayImportance,
      SE.DisplayImportanceToEnterprise,
      configurationSettings
    ),
    ГоризонтальноеПоложение: exportSystemEnumerationToEnterprise(
      data.horizontalAlign,
      SE.ItemHorizontalLocationToEnterprise,
      configurationSettings
    ),
    ...exportUserVisibleToEnterprise(data.userVisible, configurationSettings),
  }
}

registerEnterpriseExport(FormElementType.CommandBar, exportCommandBarToEnterprise)
