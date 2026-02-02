import { ConfigurationContext } from "~/metadata/context/types"
import { AutoCommandBar, AutoCommandBarEnterprise } from "~/metadata/forms/elements/autoCommandBar/types"
import { exportSystemEnumerationToYAML } from "~/metadata/systemEnumerations/exportToEnterprise"
import * as SE from "~/metadata/systemEnumerations/types"

export const exportAutoCommandBarToEnterprise = (
  context: ConfigurationContext,
  data: AutoCommandBar | undefined
): AutoCommandBarEnterprise | undefined => {
  if (!data) return undefined

  const result: AutoCommandBarEnterprise = {}

  // const autofill = exportBooleanToEnterprise(context, data.autofill)
  // if (data.autofill == false) result.Автозаполнение = autofill

  const displayImportance = exportSystemEnumerationToYAML(
    context,
    data.displayImportance,
    SE.DisplayImportanceToEnterprise
  )
  if (displayImportance !== undefined) result.ВажностьПриОтображении = displayImportance

  const horizontalAlign = exportSystemEnumerationToYAML(
    context,
    data.horizontalAlign,
    SE.ItemHorizontalLocationToEnterprise
  )
  if (horizontalAlign !== undefined) result.ГоризонтальноеПоложение = horizontalAlign

  if (Object.keys(result).length === 0) return undefined

  return result
}
