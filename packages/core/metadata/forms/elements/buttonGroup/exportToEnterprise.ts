import { exportUserVisibleToEnterprise } from "~/packages/core/metadata/commonObjects/userVisible/exportToEnterprise"
import { Context } from "~/packages/core/metadata/context/types"
import { ButtonGroup, ButtonGroupEnterprise } from "~/packages/core/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToEnterprise } from "~/packages/core/metadata/forms/elements/formGroup/exportToEnterprise"
import { compactObject } from "~/packages/core/metadata/helpers/compactObject"
import { registerMetadata } from "~/packages/core/metadata/metadataFactory/metadataFactory"
import { exportSystemEnumerationToEnterprise } from "~/packages/core/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/packages/core/metadata/systemEnumerations/types"

export const exportButtonGroupToEnterprise = (
  context: Context,
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
