import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { ButtonGroup, ButtonGroupPropsEnterprise } from "~/metadata/forms/elements/buttonGroup/types"
import { importFormGroupFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importButtonGroupFromEnterprise = <
  From extends ButtonGroupPropsEnterprise | undefined,
  Name extends string,
>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, ButtonGroup, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, ButtonGroup, Name>

  const baseFields = importFormGroupFromEnterprise(context, data, name)!

  const result: ButtonGroup = {
    ...baseFields,
    elementType: FormElementType.ButtonGroup,
    childItems: [],
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
  const userVisibleDeny = importUserVisibleFromEnterprise(
    context,
    data.ЗапретитьИспользование,
    "ЗапретитьИспользование"
  )
  if (userVisibleAllow !== undefined || userVisibleDeny !== undefined) {
    result.userVisible = userVisibleAllow || userVisibleDeny
  }

  return result
}

registerMetadata("ImportFromEnterprise", "ButtonGroup", importButtonGroupFromEnterprise)
