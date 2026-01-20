import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importCommandBarChildItemsPartialFromEnterprise } from "../../collections/commandBarChildItems/importFromEnterprise"

export const importAutoCommandBarFromEnterprise = (
  context: ConfigurationContext,
  structure: AutoCommandBar | undefined,
  enterprise: AutoCommandBarEnterprise | undefined
): AutoCommandBar | undefined => {
  if (!enterprise && !structure) return undefined

  const sourceExt: AutoCommandBar = structure ?? {
    childItems: [],
    autofill: true,
  }

  const result: AutoCommandBar = {
    ...sourceExt,
  }

  if (!enterprise) return result

  const autofill = importBooleanFromEnterprise(context, enterprise.Автозаполнение)
  if (autofill !== undefined) result.autofill = autofill

  const displayImportance = importSystemEnumerationFromEnterprise(
    context,
    enterprise.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const horizontalAlign = importSystemEnumerationFromEnterprise(
    context,
    enterprise.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

  const childItems = importCommandBarChildItemsPartialFromEnterprise(context, structure?.childItems ?? [])
  if (childItems !== undefined) result.childItems = childItems

  return result
}
