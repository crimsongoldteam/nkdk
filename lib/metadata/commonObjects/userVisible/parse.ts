import { parseBoolean } from "~/lib/metadata/commonObjects/boolean/parse"
import { TBoolEnterprise } from "~/lib/metadata/commonObjects/boolean/types"
import { TParseFunction } from "~/lib/rulesManager/types"
import { type TUserVisible } from "./types"

export const parseUserVisible: TParseFunction = (
  value: Record<string, TBoolEnterprise> | undefined,
  usageType: "РазрешитьИспользование" | "ЗапретитьИспользование" | boolean
): TUserVisible | undefined => {
  if (value === undefined || typeof usageType === "boolean") {
    return undefined
  }

  const common = usageType === "РазрешитьИспользование"

  const values = Object.entries(value).map(([key, val]) => {
    const name = key.replace(/^Role\./, "")
    const parsedValue = parseBoolean(val)!
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
