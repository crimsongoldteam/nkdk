import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationSettings } from "~/lib/metadata/configurationSettings/types"
import { ButtonGroup, ButtonGroupEnterprise } from "~/lib/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { compactObject } from "~/lib/metadata/helpers/compactObject"
import { registerMetadata } from "~/lib/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportButtonGroupToEnterprise = (
  configurationSettings: ConfigurationSettings,
  data: ButtonGroup | undefined
): ButtonGroupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(configurationSettings, data)!,

    Отображение: exportSystemEnumerationToEnterprise(configurationSettings, data.representation, SE.ButtonGroupRepresentationToEnterprise),
    ...exportUserVisibleToEnterprise(configurationSettings, data.userVisible),
  })
}

registerMetadata("ExportToEnterprise", "ButtonGroup", exportButtonGroupToEnterprise)
