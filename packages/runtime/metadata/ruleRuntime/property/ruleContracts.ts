import type { ConfigurationContextWithExportToXML } from "../../context/types"

export type ConfigurationIndexAddressingMode = "default" | "yamlPath"

export type SyncAreaDeclaration =
  | { kind: "objectModule"; yamlFile: string; xmlPath: string }
  | { kind: "formModule"; yamlFile: string; xmlPath: string }
  | { kind: "formHelp"; yamlDir: string; xmlBasePath: string }
  | { kind: "templateContent"; yamlFile: string; xmlPath: string }
  | { kind: "commandModule"; yamlFile: string; xmlPath: string }

export interface YAMLPropertySource {
  readonly itemName?: string
  has(propertyKey: string): boolean
  raw(propertyKey: string): unknown
  yamlKey(propertyKey: string): string | undefined
}

export type YAMLToXMLCondition = (
  source: YAMLPropertySource,
  context?: ConfigurationContextWithExportToXML,
) => boolean

export type TypeRulesOperations =
  | "importFromXML"
  | "importFromXMLToYAML"
  | "exportToXML"
  | "importFromYAML"
  | "exportToYAML"
  | "exportToEnterprise"
  | "exportToJSONSchema"
  | "validationSchemaRef"
  | "collectionItemRule"
  | "syncExternalFromXML"
  | "validateMetadataTarget"
  | "collectMetadataTargetReferences"
  | "structuralReferences"
  | "metadataTargetOccurrences"
  | "resourceTopology"
  | "fileChildNamesDescriptor"
  | "configurationIndexValueFromXML"
  | "collectConfigurationIndexFromXML"
  | "xmlImportPropertyBehavior"
  | "nestedItemIdentity"
  | "nestedItemRule"
  | "resolveNestedImportXMLSources"
  | "finalizeImportedYAML"
  | "requiresImportedYAMLFinalization"
  | "finalizeExportedXML"
  | "collectLocalFactsFromYAML"
  | "yamlToXMLNestedRule"
  | "yamlScalarTagPolicy"
