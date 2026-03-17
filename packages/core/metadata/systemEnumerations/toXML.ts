import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"

type ScrollBarUse = "AutoUse" | "DontUse" | "UseAlways"

export const exportSystemEnumerationToXML = (params: {
  rule: SystemEnumerationPropertyRule
  value: unknown
}): any | undefined => {
  const { rule, value } = params

  if (rule.typeSE === "ScrollBarUse") {
    const v = value as ScrollBarUse | undefined
    if (v === undefined) return undefined
    if (v === "AutoUse") return undefined
    if (v === "DontUse") return false
    if (v === "UseAlways") return true
    return undefined
  }

  return value
}

registerTypeRule(
  "SystemEnumeration",
  "exportToXML",
  (params: { rule: unknown; value: unknown }) =>
  exportSystemEnumerationToXML({
    rule: params.rule as SystemEnumerationPropertyRule,
    value: params.value,
  })
)

