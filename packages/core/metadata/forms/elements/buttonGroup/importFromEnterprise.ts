import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup, ButtonGroupEnterprise } from "~/metadata/forms/elements/buttonGroup/types"
import { importFormGroupFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importButtonGroupFromEnterprise = (
  context: ConfigurationContext,
  data: ButtonGroupEnterprise | undefined,
  name: string
): ButtonGroup | undefined => {
  if (!data) return undefined

  const baseFields = importFormGroupFromEnterprise(context, data, name)!
  const { elementType: _, ...restFields } = baseFields

  const result: ButtonGroup = {
    elementType: FormElementType.ButtonGroup,
    ...restFields,
  }

  const representation = importSystemEnumerationFromEnterprise<SE.ButtonGroupRepresentation>(
    context,
    data.Отображение,
    SE.ButtonGroupRepresentationFromEnterprise
  )
  if (representation !== undefined) result.representation = representation

  const userVisibleAllow = importUserVisibleFromEnterprise(
    context,
    data.РазрешитьИспользование,
    "РазрешитьИспользование"
  )
  const userVisibleDeny = importUserVisibleFromEnterprise(context, data.ЗапретитьИспользование, "ЗапретитьИспользование")
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  return result
}

registerMetadata("ImportFromEnterprise", "ButtonGroup", importButtonGroupFromEnterprise)

