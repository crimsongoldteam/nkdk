import { TypeDescriptionRules } from "../commonObjects/typeDescription/types"
import { ConfigurationContext } from "../context/types"
import { SystemEnumerationDcsValueRootXML } from "./dcsTypes"
import { SystemEnumerationPropertyRule } from "./types"

export const resolveSystemEnumerationXsiType = (typeSE: string): string => {
  const tr = TypeDescriptionRules[typeSE as keyof typeof TypeDescriptionRules]
  if (tr) {
    return `${tr.prefix}:${typeSE}`
  }
  if (typeSE.startsWith("DataComposition")) {
    return `dcscor:${typeSE}`
  }
  return `ent:${typeSE}`
}

export const exportSystemEnumerationToDcsXML = (
  _context: ConfigurationContext,
  rule: SystemEnumerationPropertyRule,
  value: string | undefined
): SystemEnumerationDcsValueRootXML | undefined => {
  if (value === undefined) {
    return undefined
  }
  const xsiType = resolveSystemEnumerationXsiType(rule.typeSE)
  return {
    "dcscor:value": {
      "_xsi:type": xsiType,
      "#text": value,
    },
  }
}
