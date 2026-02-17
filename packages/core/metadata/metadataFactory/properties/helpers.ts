import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "./types"

export const getValueOrDefault = (context: ConfigurationContext, rule: PropertyRule<any>, value: any): any => {
  if (value !== undefined) {
    return value
  }

  if (typeof rule.defaultValue === "function") {
    return rule.defaultValue(context)
  }

  return rule.defaultValue
}
