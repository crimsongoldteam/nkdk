import { registerTypeRule } from "~/metadata/orchestration/formElement/factory"
import { SystemEnumerationPropertyRule } from "~/metadata/systemEnumerations/types"

type ScrollBarUse = "AutoUse" | "DontUse" | "UseAlways"

export const importSystemEnumerationFromXML = (params: {
  rule: SystemEnumerationPropertyRule
  xml: unknown
}): any | undefined => {
  const { rule, xml } = params

  if (rule.typeSE === "ScrollBarUse") {
    if (xml === undefined || xml === null) return undefined
    if (xml === true || xml === "true") return "UseAlways" satisfies ScrollBarUse
    if (xml === false || xml === "false") return "DontUse" satisfies ScrollBarUse
    return undefined
  }

  return xml
}

registerTypeRule("SystemEnumeration", "importFromXML", (context, rule, xml) => {
  void context
  return importSystemEnumerationFromXML({ rule: rule as SystemEnumerationPropertyRule, xml })
})

