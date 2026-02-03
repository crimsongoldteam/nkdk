import { importBooleanFromYAML } from "~/metadata/commonObjects/boolean/importFromYAML"
import { StringboolEnterprise } from "~/metadata/commonObjects/boolean/types"
import { PropertyRule } from "~/metadata/forms/elements/calendarField/rules"
import { ConfigurationContext } from "../../context/types"
import { type UserVisible } from "./types"

export const importUserVisibleFromYAML = (
  context: ConfigurationContext,
  _rule: PropertyRule | undefined,
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
    const parsedValue = importBooleanFromYAML(context, _rule, val)!
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
