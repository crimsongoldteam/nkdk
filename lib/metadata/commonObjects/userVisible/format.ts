import { type TUserVisible, type TUserVisibleEnterprise } from "./types"
import { formatBoolean } from "~/lib/format/formatBool"
import { TBoolEnterprise } from "~/lib/format/types"
import { TElementRule } from "~/lib/rulesManager/types"

export function formatUserVisible(
  value: TUserVisible | undefined,
  _rule: TElementRule
): Record<string, any> | undefined {
  if (!value) return undefined

  const values: Record<string, TBoolEnterprise> = {}
  value.values.forEach((item) => {
    values[item.name] = formatBoolean(item.value)!
  })

  return values

  // if (value.common) {
  //   return {
  //     РазрешитьИспользование: values,
  //   }
  // } else {
  //   return {
  //     ЗапретитьИспользование: values,
  //   }
  // }
}
