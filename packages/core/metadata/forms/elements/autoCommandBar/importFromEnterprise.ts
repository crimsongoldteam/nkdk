import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { importSystemEnumerationFromEnterprise } from "~/metadata/systemEnumerations/importFromEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const importAutoCommandBarFromEnterprise = (
  context: ConfigurationContext,
  source: AutoCommandBar | undefined,
  data: AutoCommandBarEnterprise | undefined
): AutoCommandBar | undefined => {
  if (!data && !source) throw new Error("AutoCommandBar data or source is required")

  const sourceExt: AutoCommandBar = source ?? {
    childItems: [],
    autofill: true,
  }

  const result: AutoCommandBar = {
    ...sourceExt,
  }

  if (!data) return result

  const autofill = importBooleanFromEnterprise(context, data.Автозаполнение)
  if (autofill !== undefined) result.autofill = autofill

  const displayImportance = importSystemEnumerationFromEnterprise(
    context,
    data.ВажностьПриОтображении,
    SE.DisplayImportanceFromEnterprise
  )
  if (displayImportance !== undefined) result.displayImportance = displayImportance

  const horizontalAlign = importSystemEnumerationFromEnterprise(
    context,
    data.ГоризонтальноеПоложение,
    SE.ItemHorizontalLocationFromEnterprise
  )
  if (horizontalAlign !== undefined) result.horizontalAlign = horizontalAlign

  return result
}
