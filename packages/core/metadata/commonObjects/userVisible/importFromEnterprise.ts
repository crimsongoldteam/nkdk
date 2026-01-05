import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { ConfigurationContext } from "../../context/types"
import { type UserVisible } from "./types"

export const importUserVisibleFromEnterprise = (
  context: ConfigurationContext,
  value: Record<string, StringboolEnterprise> | undefined,
  usageType: "РазрешитьИспользование" | "ЗапретитьИспользование" | undefined
): UserVisible | undefined => {
  if (value === undefined || typeof usageType === "boolean") {
    return undefined
  }

  const common = usageType === "РазрешитьИспользование"

  const values = Object.entries(value).map(([key, val]) => {
    const name = key.replace(/^Role\./, "")
    const parsedValue = importBooleanFromEnterprise(context, val)!
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
