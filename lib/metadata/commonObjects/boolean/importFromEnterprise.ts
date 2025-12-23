import { Context } from "../../context/types"
import { StringboolEnterprise } from "./types"

export const parseBoolean = (
  value: StringboolEnterprise | undefined,
  _configurationSettings: Context
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}
