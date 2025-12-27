import { parseBoolean } from "~/packages/core/metadata/commonObjects/boolean/importFromEnterprise"
import { StringboolEnterprise } from "~/packages/core/metadata/commonObjects/boolean/types"
import { Context } from "../../context/types"
import { type UserVisible } from "./types"

export const parseUserVisible = (
  value: Record<string, StringboolEnterprise> | undefined,
  usageType: "РазрешитьИспользование" | "ЗапретитьИспользование" | undefined,
  context: Context
): UserVisible | undefined => {
  if (value === undefined || typeof usageType === "boolean") {
    return undefined
  }

  const common = usageType === "РазрешитьИспользование"

  const values = Object.entries(value).map(([key, val]) => {
    const name = key.replace(/^Role\./, "")
    const parsedValue = parseBoolean(val, context)!
    return {
      name,
      value: parsedValue,
    }
  })

  return {
    common,
    values,
  }
}
