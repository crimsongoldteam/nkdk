import { ConfigurationContext } from "../context/types"

type TypeRulesNames = "boolean" | "string"

export interface TypeRule {
  importFromXML?: (context: ConfigurationContext, rule: PropertyKey, value: any) => any
  exportToXML?: (context: ConfigurationContext, rule: PropertyKey, value: any) => any
  importFromEnterprise?: (context: ConfigurationContext, rule: PropertyKey, value: any) => any
  exportToEnterprise?: (context: ConfigurationContext, rule: PropertyKey, value: any) => any
  exportToPreview?: (context: ConfigurationContext, rule: PropertyKey, value: any) => any
}

type TypeRulesOperations = keyof TypeRule

const typeRulesRegistry = new Map<string, TypeRule>()

export function registerTypeRule(type: TypeRulesNames, operation: TypeRulesOperations, typeRule: TypeRule): void {
  typeRulesRegistry.set(type, typeRule)
}

export const getTypeRule = (type: string, operation: TypeRulesOperations): TypeRule | undefined => {
  return typeRulesRegistry.get(type)
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
}
