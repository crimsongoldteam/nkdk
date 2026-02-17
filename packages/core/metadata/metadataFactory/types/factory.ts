import {
  ExportToEnterpriseFunction,
  ExportToPreviewFunction,
  ExportToXMLFunction,
  ExportToXMLFunctionNew,
  ImportExportFunction,
  ImportFromEnterpriseFunction,
  ImportFromXMLFunction,
  ImportFromYAMLFunctionNew,
  TypeRulesNames,
  TypeRulesOperations,
  createRegistryKey,
} from "./types"

const typeRulesRegistry = new Map<
  string,
  | ImportFromEnterpriseFunction
  | ExportToEnterpriseFunction
  | ImportFromXMLFunction
  | ExportToXMLFunction
  | ExportToPreviewFunction
  | ExportToXMLFunctionNew
  | ImportFromYAMLFunctionNew
>()

export const registerTypeRule = <O extends TypeRulesOperations>(
  type: TypeRulesNames,
  operation: O,
  ruleFunction: NonNullable<ImportExportFunction<O>>
) => {
  const key = createRegistryKey(type, operation)
  typeRulesRegistry.set(key, ruleFunction)
}

export const getTypeRule = <O extends TypeRulesOperations>(
  type: TypeRulesNames,
  operation: O
): O extends "importFromEnterprise"
  ? ImportFromEnterpriseFunction | ImportFromYAMLFunctionNew | undefined
  : O extends "exportToEnterprise"
    ? ExportToEnterpriseFunction | undefined
    : O extends "exportToXML"
      ? ExportToXMLFunction | ExportToXMLFunctionNew | undefined
      : O extends "importFromXML"
        ? ImportFromXMLFunction | undefined
        : O extends "exportToPreview"
          ? ExportToPreviewFunction | undefined
          : never => {
  const key = createRegistryKey(type, operation)
  const result = typeRulesRegistry.get(key)
  return result as any
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
}
