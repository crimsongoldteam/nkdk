import {
  ExportToPreviewFunction,
  ExportToXMLFunction,
  ExportToXMLFunctionNew,
  ExportToYAMLFunction,
  ExportToYAMLFunctionNew,
  ImportExportFunction,
  ImportFromXMLFunction,
  ImportFromYAMLFunction,
  ImportFromYAMLFunctionNew,
  TypeRulesNames,
  TypeRulesOperations,
  createRegistryKey,
} from "./types"

const typeRulesRegistry = new Map<
  string,
  | ImportFromYAMLFunction
  | ExportToYAMLFunction
  | ImportFromXMLFunction
  | ExportToXMLFunction
  | ExportToPreviewFunction
  | ExportToXMLFunctionNew
  | ImportFromYAMLFunctionNew
  | ExportToYAMLFunctionNew
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
): O extends "importFromYAML"
  ? ImportFromYAMLFunction | ImportFromYAMLFunctionNew | undefined
  : O extends "exportToYAML"
    ? ExportToYAMLFunction | ExportToYAMLFunctionNew | undefined
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
