import { exportUserVisibleToEnterprise } from "~/lib/metadata/commonObjects/userVisible/exportToEnterprise"
import { ButtonGroup, ButtonGroupEnterprise } from "~/lib/metadata/forms/elements/buttonGroup/types"
import { exportFormGroupToEnterprise } from "~/lib/metadata/forms/elements/formGroup/exportToEnterprise"
import { FormElementType } from "~/lib/metadata/forms/elements/types"
import { exportSystemEnumerationToEnterprise } from "~/lib/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/lib/metadata/systemEnumerations/types"

export const exportButtonGroupToEnterprise = (data: ButtonGroup | undefined): ButtonGroupEnterprise | undefined => {
  if (!data) return undefined

  return {
    ...exportFormGroupToEnterprise(data)!,

    Отображение: exportSystemEnumerationToEnterprise(data.representation, SE.ButtonGroupRepresentationToEnterprise),
    ПользовательскаяВидимость: exportUserVisibleToEnterprise(data.userVisible),
  }
}

registerEnterpriseExport(FormElementType.ButtonGroup, exportButtonGroupToEnterprise)
