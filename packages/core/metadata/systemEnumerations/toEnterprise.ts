import { ConfigurationContext } from "../context/types"
import { registerTypeRule } from "../orchestration"
import { SystemEnumerationEnterprise, SystemEnumerationPropertyRule } from "./types"

export const exportSystemEnumerationToEnterprise = (params: {
  context: ConfigurationContext
  rule: SystemEnumerationPropertyRule
  value: string | undefined
}): SystemEnumerationEnterprise | undefined => {
  const { rule, value } = params
  if (!value) return undefined

  const enumerationName = rule.typeSE

  return {
    Type: "SystemEnumeration",
    Value: `${enumerationName}.${value}`,
  }
}

registerTypeRule("SystemEnumeration", "exportToEnterprise", exportSystemEnumerationToEnterprise as any)
