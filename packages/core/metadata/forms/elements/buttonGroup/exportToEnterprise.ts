import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup, ButtonGroupEnterprise } from "~/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { compactObject } from "~/metadata/helpers/compactObject"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportButtonGroupToEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroup | undefined
): ButtonGroupEnterprise | undefined => {
  if (!data) return undefined

  return compactObject({
    ...exportFormGroupToEnterprise(context, data)!,

    Отображение: exportSystemEnumerationToEnterprise(
      context,
      data.representation,
      SE.ButtonGroupRepresentationToEnterprise
    ),
    ...exportUserVisibleToEnterprise(context, data.userVisible),
  })
}

registerMetadata("ExportToEnterprise", "ButtonGroup", exportButtonGroupToEnterprise)
