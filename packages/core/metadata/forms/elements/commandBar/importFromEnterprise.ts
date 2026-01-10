import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { importUserVisibleFromEnterprise } from "~/metadata/commonObjects/userVisible/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { CommandBar, CommandBarEnterprise } from "~/metadata/forms/elements/commandBar/types"
import { importFormGroupFromEnterprise } from "~/metadata/forms/elements/formGroup/importFromEnterprise"
import { ImportFromEnterpriseReturn } from "~/metadata/forms/elements/types"
import { registerMetadata } from "~/metadata/metadataFactory/metadataFactory"
import { FormElementType } from "~/metadata/metadataFactory/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importCommandBarFromEnterprise = <
  From extends CommandBarEnterprise | undefined,
  Name extends string,
>(
  context: ConfigurationContext,
  data: From,
  name: Name
): ImportFromEnterpriseReturn<From, CommandBar, Name> => {
  if (!data) return undefined as ImportFromEnterpriseReturn<From, CommandBar, Name>

  const baseFields = importFormGroupFromEnterprise(context, data, name)!

  const result: ImportFromEnterpriseReturn<From, CommandBar, Name> = {
    ...baseFields,
    elementType: FormElementType.CommandBar,
  }

  const autofill = importBooleanFromEnterprise(context, data.Автозаполнение)
  if (autofill !== undefined) result.autofill = autofill

  const displayImportance = importSystemEnumerationFromEnterprise<SE.DisplayImportance>(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const horizontalAlign = importSystemEnumerationFromEnterprise<SE.ItemHorizontalLocation>(
    context,
    data.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

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

registerMetadata("ImportFromEnterprise", "CommandBar", importCommandBarFromEnterprise)
