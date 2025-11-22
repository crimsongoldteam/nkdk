import { TBoolEnterprise } from "./types"

export const parseBoolean = (
  value: TBoolEnterprise | undefined
): boolean | undefined => {
  if (value === undefined) return undefined
  return value === "Истина"
}
