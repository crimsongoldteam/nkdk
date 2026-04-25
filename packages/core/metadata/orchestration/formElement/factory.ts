import { PropertyRuleType } from "~/metadata/orchestration/property/registry"
import {
  BuildGraphFromModelFunction,
  createRegistryKey,
  ExportToEnterpriseFunction,
  ExportToJSONSchemaFn,
  ExportToXMLFunction,
  ExportToXMLFunctionNew,
  ExportToYAMLFunction,
  ExportToYAMLFunctionNew,
  ExtractGraphFromModelFunction,
  GraphEdgeFromParent,
  GraphChildRule,
  importExportFunction,
  ImportFromXMLFunction,
  importFromYAMLFunction as ImportFromYAMLFunction,
  ImportFromYAMLFunctionNew,
  SyncExternalFromXMLFunction,
  SyncExternalToXMLFunction,
  TypeRulesOperations,
} from "../property/fn"

const typeRulesRegistry = new Map<
  string,
  | ImportFromYAMLFunction
  | ExportToYAMLFunction
  | ImportFromXMLFunction
  | ExportToXMLFunction
  | ExportToEnterpriseFunction
  | ExportToXMLFunctionNew
  | ImportFromYAMLFunctionNew
  | ExportToYAMLFunctionNew
  | BuildGraphFromModelFunction
  | ExtractGraphFromModelFunction
  | GraphEdgeFromParent
  | GraphChildRule
  | SyncExternalFromXMLFunction
  | SyncExternalToXMLFunction
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
  ? ImportFromYAMLFunction | ImportFromYAMLFunctionNew | undefined
  : O extends "exportToYAML"
    ? ExportToYAMLFunction | ExportToYAMLFunctionNew | undefined
    : O extends "exportToXML"
      ? ExportToXMLFunction | ExportToXMLFunctionNew | undefined
      : O extends "importFromXML"
        ? ImportFromXMLFunction | undefined
        : O extends "exportToEnterprise"
          ? ExportToEnterpriseFunction | undefined
          : O extends "exportToJSONSchema"
            ? ExportToJSONSchemaFn | undefined
            : O extends "buildGraphFromModel"
              ? BuildGraphFromModelFunction | undefined
              : O extends "extractGraph"
                ? ExtractGraphFromModelFunction | undefined
                : O extends "graphEdgeFromParent"
                  ? GraphEdgeFromParent | undefined
                  : O extends "graphChild"
                    ? GraphChildRule | undefined
                    : O extends "syncExternalFromXML"
                      ? SyncExternalFromXMLFunction | undefined
                      : O extends "syncExternalToXML"
                        ? SyncExternalToXMLFunction | undefined
                        : never => {
  const key = createRegistryKey(type, operation)
  const result = typeRulesRegistry.get(key)
  return result as any
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
}
