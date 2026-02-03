import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { importSystemEnumerationFromYAML } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"
import { importChildItemsPartialFromEnterprise } from "../../collections/childItems/importFromEnterprise"
import { PropertyRule } from "../calendarField/rules"

export const importAutoCommandBarFromEnterprise = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
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

  const childItems = importChildItemsPartialFromEnterprise(context, undefined, structure?.childItems ?? [])
  if (childItems !== undefined) result.childItems = childItems

  if (!enterprise || Object.keys(enterprise).length === 0) return result

  const autofill = importBooleanFromEnterprise(context, undefined, enterprise.Автозаполнение)
  if (autofill !== undefined) result.autofill = autofill

  const displayImportance = importSystemEnumerationFromYAML(
    context,
    undefined,
    enterprise.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const horizontalAlign = importSystemEnumerationFromYAML(
    context,
    undefined,
    enterprise.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

  return result
}
