import { PropertyRuleType } from "./registry"
import {
  CollectionItemRule,
  CollectMetadataTargetReferencesFunction,
  ConfigurationIndexValueFromXMLDescriptor,
  createRegistryKey,
  ExportToEnterpriseFunction,
  ExportToJSONSchemaFn,
  ExportToXMLFunction,
  ExportToXMLFunctionNew,
  ExportToYAMLFunction,
  ExportToYAMLFunctionNew,
  FileChildNamesDescriptorFunction,
  importExportFunction,
  ImportFromXMLFunction,
  importFromYAMLFunction as ImportFromYAMLFunction,
  ImportFromYAMLFunctionNew,
  ProjectResourcesFunction,
  StructuralReferencesFunction,
  SyncExternalFromXMLFunction,
  SyncExternalToXMLFunction,
  TypeRulesOperations,
  ValidateMetadataTargetFunction,
  XmlSyncRoutesFunction,
  XmlImportRoutesFunction,
  XmlSyncWriterFunction,
  XMLImportPropertyBehavior,
} from "./fn"

const typeRulesRegistry = new Map<
  string,
  | ImportFromYAMLFunction
  | ExportToYAMLFunction
  | ImportFromXMLFunction
  | ExportToXMLFunction
  | ExportToEnterpriseFunction
  | ExportToJSONSchemaFn
  | ExportToXMLFunctionNew
  | ImportFromYAMLFunctionNew
  | ExportToYAMLFunctionNew
  | CollectionItemRule
  | SyncExternalFromXMLFunction
  | SyncExternalToXMLFunction
  | ValidateMetadataTargetFunction
  | CollectMetadataTargetReferencesFunction
  | StructuralReferencesFunction
  | ProjectResourcesFunction
  | XmlSyncRoutesFunction
  | XmlImportRoutesFunction
  | FileChildNamesDescriptorFunction
  | XmlSyncWriterFunction
  | ConfigurationIndexValueFromXMLDescriptor
  | XMLImportPropertyBehavior
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
            : O extends "collectionItemRule"
              ? CollectionItemRule | undefined
              : O extends "syncExternalFromXML"
                ? SyncExternalFromXMLFunction | undefined
                : O extends "syncExternalToXML"
                  ? SyncExternalToXMLFunction | undefined
                  : O extends "validateMetadataTarget"
                    ? ValidateMetadataTargetFunction | undefined
                    : O extends "collectMetadataTargetReferences"
                      ? CollectMetadataTargetReferencesFunction | undefined
                      : O extends "structuralReferences"
                        ? StructuralReferencesFunction | undefined
                        : O extends "projectResources"
                          ? ProjectResourcesFunction | undefined
                          : O extends "xmlSyncRoutes"
                            ? XmlSyncRoutesFunction | undefined
                            : O extends "xmlImportRoutes"
                              ? XmlImportRoutesFunction | undefined
                              : O extends "fileChildNamesDescriptor"
                                ? FileChildNamesDescriptorFunction | undefined
                                : O extends "xmlSyncWriter"
                                  ? XmlSyncWriterFunction | undefined
                                  : O extends "configurationIndexValueFromXML"
                                    ? ConfigurationIndexValueFromXMLDescriptor | undefined
                                    : O extends "xmlImportPropertyBehavior"
                                      ? XMLImportPropertyBehavior | undefined
                                      : never => {
  const key = createRegistryKey(type, operation)
  const result = typeRulesRegistry.get(key)
  return result as any
}

export const clearTypeRulesRegistry = (): void => {
  typeRulesRegistry.clear()
}
