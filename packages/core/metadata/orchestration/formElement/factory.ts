import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import {
  createRegistryKey,
  ExportToEnterpriseFunction,
  ExportToJSONSchemaFn,
  ExportToXMLFunction,
  ExportToXMLFunctionNew,
  ExportToYAMLFunction,
  ExportToYAMLFunctionNew,
  importExportFunction,
  importFromXMLFunction,
  importFromYAMLFunction,
  importFromYAMLFunctionNew,
  TypeRulesOperations,
} from "../property/fn"

const typeRulesRegistry = new Map<
  string,
  | importFromYAMLFunction
  | ExportToYAMLFunction
  | importFromXMLFunction
  | ExportToXMLFunction
  | ExportToEnterpriseFunction
  | ExportToXMLFunctionNew
  | importFromYAMLFunctionNew
  | ExportToYAMLFunctionNew
>()

export const registerTypeRule = <O extends TypeRulesOperations>(
  type: PropertyRuleType,
  operation: O,
  ruleFunction: NonNullable<importExportFunction<O>>
) => {
  const key = createRegistryKey(type, operation)
  typeRulesRegistry.set(key, ruleFunction)
}

export const getTypeRule = <O extends TypeRulesOperations>(
  type: PropertyRuleType,
  operation: O
): O extends "importFromYAML"
  ? importFromYAMLFunction | importFromYAMLFunctionNew | undefined
  : O extends "exportToYAML"
    ? ExportToYAMLFunction | ExportToYAMLFunctionNew | undefined
    : O extends "exportToXML"
      ? ExportToXMLFunction | ExportToXMLFunctionNew | undefined
      : O extends "importFromXML"
        ? importFromXMLFunction | undefined
        : O extends "exportToEnterprise"
          ? ExportToEnterpriseFunction | undefined
          : O extends "exportToJSONSchema"
            ? ExportToJSONSchemaFn | undefined
            : never => {
  const key = createRegistryKey(type, operation)
  const result = typeRulesRegistry.get(key)
  return result as any
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
}
