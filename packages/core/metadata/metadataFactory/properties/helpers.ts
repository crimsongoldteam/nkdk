import { ConfigurationContext } from "~/metadata/context/types"
import { PropertyRule } from "./types"

export const getValueOrDefault = (params: {
  context: ConfigurationContext
  rule: PropertyRule<any>
  value: any
  name?: string
}): any => {
  const { context, rule, value, name } = params

  if (value !== undefined) {
    return value
  }

  if (typeof rule.defaultValue === "function") {
    return rule.defaultValue({ context, name })
  }

  return rule.defaultValue
}
