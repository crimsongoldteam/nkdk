import { exportBooleanToEnterprise } from "~/lib/metadata/commonObjects/boolean/exportToEnterprise"
import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { type UserVisible } from "./types"

export const exportUserVisibleToEnterprise = (value: UserVisible | undefined): Record<string, any> | undefined => {
  if (!value) return undefined

  const values: Record<string, StringboolEnterprise> = {}
  value.values.forEach((item) => {
    values[item.name] = exportBooleanToEnterprise(item.value)!
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
