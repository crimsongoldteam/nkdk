import { exportUserVisibleToEnterprise } from "~/metadata/commonObjects/userVisible/exportToEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup, ButtonGroupEnterprise } from "~/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToEnterprise } from "~/metadata/forms/elements/formGroup/exportToEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportButtonGroupToEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroup | undefined
): ButtonGroupEnterprise | undefined => {
  if (!data) return undefined

  const baseFields = exportFormGroupToEnterprise(context, data)

  const result: ButtonGroupEnterprise = {
    ...baseFields,
  }

  const representation = exportSystemEnumerationToEnterprise(
    context,
    data.representation,
    SE.ButtonGroupRepresentationToEnterprise
  )
  if (representation !== undefined) result.Отображение = representation

  const userVisible = exportUserVisibleToEnterprise(context, data.userVisible)
  if (userVisible !== undefined) {
    Object.assign(result, userVisible)
  }

  return result
}

registerMetadata("ExportToEnterprise", "ButtonGroup", exportButtonGroupToEnterprise)
