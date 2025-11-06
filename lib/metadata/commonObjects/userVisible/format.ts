import { type TUserVisible, type TUserVisibleEnterprise } from "./types"
import { formatBool } from "~/lib/format/formatBool"
import { TBoolEnterprise } from "~/lib/format/types"

export function formatUse(
  use: TUserVisible | undefined
): TUserVisibleEnterprise | undefined {
  if (!use) return undefined

  const values: Record<string, TBoolEnterprise> = {}
  use.values.forEach((item) => {
    values[item.name] = formatBool(item.value)!
  })

  if (use.common) {
    return {
      РазрешитьИспользование: values,
    }
  } else {
    return {
      ЗапретитьИспользование: values,
    }
  }
}
