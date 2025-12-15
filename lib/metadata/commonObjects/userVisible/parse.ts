import { parseBoolean } from "~/lib/metadata/commonObjects/boolean/parse"
import { StringboolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { TConfigurationSettings } from "../../configurationSettings/types"
import { type UserVisible } from "./types"

export const parseUserVisible = (
  value: Record<string, StringboolEnterprise> | undefined,
  usageType: "РазрешитьИспользование" | "ЗапретитьИспользование" | undefined,
  configurationSettings: TConfigurationSettings
): UserVisible | undefined => {
  if (value === undefined || typeof usageType === "boolean") {
    return undefined
  }

  const common = usageType === "РазрешитьИспользование"

  const values = Object.entries(value).map(([key, val]) => {
    const name = key.replace(/^Role\./, "")
    const parsedValue = parseBoolean(val, configurationSettings)
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
