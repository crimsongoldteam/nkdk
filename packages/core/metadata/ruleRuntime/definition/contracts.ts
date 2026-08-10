import type { TSchema } from "typebox"

import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { MetadataComponentDescriptor } from "../../components/descriptor"
import type { ConfigurationContext } from "../../context/types"
import type { Diagnostic, YamlPath } from "../../diagnostics/types"
import type { RegisteredProjectSpec } from "../../projectDefinition/projectSpecContracts"
import type { MetadataResourceTopologyProvider } from "../../resourceTopology/core/providerRegistry"
import type { ElementRule } from "../formElement/types"
import type {
  DependentImportItemHandler,
  DependentStructuralItemHandler,
  DependentYamlItemHandler,
} from "../property/dependentItemRegistry"
import type { ExplicitXMLPropertyRegistration } from "../property/explicitXMLPropertyRegistry"
import type {
  importExportFunction,
  TypeRulesOperations,
} from "../property/fn"
import type { RegisteredSystemEnumeration } from "../property/systemEnumerationRegistry"
import type { IndexValueFromYAMLFunction } from "../property/indexValueFromYAMLRegistry"
import type { MetadataTargetOwnerResolver } from "../property/metadataTargetOwnerRegistry"
import type { MetadataItemRule } from "../property/types"

export type PropertyTypeDefinition = {
  readonly [Operation in TypeRulesOperations]?: NonNullable<
    importExportFunction<Operation>
  >
}

export interface MetadataSchemaDefinition {
  readonly export: (params: { context: ConfigurationContext }) => TSchema
}

export interface RuleRegistrationContribution {
  readonly register: () => void
}

export interface LocalYamlValueValidationParams {
  readonly filePath: string
  readonly parsed: ParsedYaml
  readonly value: unknown
  readonly yamlPath: YamlPath
  readonly owner: { readonly dir: string; readonly name: string }
}

export interface LocalYamlValueValidationContribution {
  readonly kind: "localYamlValue"
  readonly propertyType: string
  readonly validate: (
    params: LocalYamlValueValidationParams,
  ) => readonly Diagnostic[]
  readonly profileSubstep?: string
}

export interface DependentItemDefinition {
  readonly yaml?: DependentYamlItemHandler
  readonly structural?: DependentStructuralItemHandler
  readonly imported?: DependentImportItemHandler
}

export interface MetadataRulesDefinition {
  readonly propertyTypes: Readonly<Record<string, PropertyTypeDefinition>>
  readonly propertyItemRules: Readonly<Record<string, object>>
  readonly explicitXMLProperties: Readonly<
    Record<string, ExplicitXMLPropertyRegistration>
  >
  readonly dependentItems: Readonly<Record<string, DependentItemDefinition>>
  readonly indexValuesFromYAML: Readonly<
    Record<string, IndexValueFromYAMLFunction>
  >
  readonly metadataTargetOwners: Readonly<
    Record<string, MetadataTargetOwnerResolver>
  >
  readonly metadataItems: Readonly<Record<string, MetadataItemRule>>
  readonly formElements: Readonly<Record<string, ElementRule>>
  readonly systemEnumerations: Readonly<
    Record<string, RegisteredSystemEnumeration>
  >
  readonly schemas: Readonly<Record<string, MetadataSchemaDefinition>>
  readonly projectSpecs: Readonly<Record<string, RegisteredProjectSpec>>
  readonly resourceTopology: readonly MetadataResourceTopologyProvider[]
  readonly validation: readonly LocalYamlValueValidationContribution[]
  readonly dataPaths: readonly RuleRegistrationContribution[]
  readonly references: readonly RuleRegistrationContribution[]
  readonly components: readonly MetadataComponentDescriptor[]
  readonly imports: readonly RuleRegistrationContribution[]
  readonly synchronization: readonly RuleRegistrationContribution[]
  readonly operations: readonly RuleRegistrationContribution[]
  readonly workerOperations: readonly RuleRegistrationContribution[]
}
