import { importBooleanFromEnterprise } from "~/metadata/commonObjects/boolean/importFromEnterprise"
import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { ConfigurationContext } from "../../context/types"
import { type UserVisible } from "./types"

export const importUserVisibleFromEnterprise = (
  context: ConfigurationContext,
  valueAllow: Record<string, StringboolEnterprise> | undefined,
  valueDeny: Record<string, StringboolEnterprise> | undefined
): UserVisible | undefined => {
  if (valueAllow === undefined && valueDeny === undefined) {
    return undefined
  }

  const common = valueAllow !== undefined

  const value = common ? valueAllow : valueDeny!

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
