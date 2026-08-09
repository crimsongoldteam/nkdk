import type { PropertyRule } from "../../orchestration/property/types"
import { registerTypeRule } from "../../orchestration/property/typeRuleRegistry"
import { ConfigurationContext } from "../../context/types"
import { assertTypeDescriptionYAMLAllowed } from "./allowedTypes"
import { parseTypeDescriptionYAML } from "./parseYAML"
import { TypeDescription, TypeDescriptionYAML } from "./types"

export const importTypeDescriptionFromYAML = (
  _context: ConfigurationContext,
  rule: PropertyRule | undefined,
  value: TypeDescriptionYAML | undefined
): TypeDescription | undefined => {
  if (value === undefined) return undefined

  if (rule?.type === "TypeDescription" && rule.allowedTypes !== undefined) {
    assertTypeDescriptionYAMLAllowed({ value, allowedTypes: rule.allowedTypes })
  }

  return parseTypeDescriptionYAML(value)
}

registerTypeRule("TypeDescription", "importFromYAML", importTypeDescriptionFromYAML)
