import { formatBoolean } from "~/lib/metadata/commonObjects/boolean/format"
import { TBoolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { type UserVisible } from "./types"

export const formatUserVisible = (
  value: UserVisible | undefined
): Record<string, any> | undefined => {
  if (!value) return undefined

  const values: Record<string, TBoolEnterprise> = {}
  value.values.forEach((item) => {
    values[item.name] = formatBoolean(item.value)!
  })

  return values
}

export const getUserVisibleKey = (value: UserVisible | undefined): string => {
  if (!value) throw new Error("User visible is undefined")

  if (value.common) {
    return "РазрешитьИспользование"
  }
  return "ЗапретитьИспользование"
}
