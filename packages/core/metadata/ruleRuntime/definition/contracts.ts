import type { TSchema } from "typebox"

import type { ParsedYaml } from "../../../yaml/parseMetadataYaml"
import type { ComponentAddress } from "../../components/address"
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
  readonly source?: object | string
  readonly export: (params: { context: ConfigurationContext }) => TSchema
}

export type MetadataSchemaPropertyRefDefinition = (params: {
  readonly context: ConfigurationContext
  readonly rule: import("../property/types").PropertyRule
}) => TSchema | undefined

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

export interface MetadataImportComponentDescriptor {
  readonly kind: string
  detect(root: Readonly<Record<string, unknown>>): boolean
  resolveAddress(root: Readonly<Record<string, unknown>>): ComponentAddress
  readonly baseAddress?: ComponentAddress
  readonly metadataItemAugmenter?: string
}

export type MetadataWorkerOperationOutcome =
  | "success"
  | "failure"
  | "cancelled"

export interface MetadataWorkerOperationRuleTypeMap {
  probe: {
    readonly command: { readonly kind: "probe"; readonly value: string }
    readonly result: { readonly kind: "probeResult"; readonly value: string }
    readonly state: object
  }
}

export type MetadataWorkerOperationContribution = {
  readonly [Kind in keyof MetadataWorkerOperationRuleTypeMap]: {
    readonly kind: Kind
    readonly handler: (
      command: MetadataWorkerOperationRuleTypeMap[Kind]["command"],
      state: MetadataWorkerOperationRuleTypeMap[Kind]["state"],
    ) => Promise<MetadataWorkerOperationRuleTypeMap[Kind]["result"]>
    readonly reset?: (
      state: MetadataWorkerOperationRuleTypeMap[Kind]["state"],
      outcome: MetadataWorkerOperationOutcome,
    ) => Promise<void>
  }
}[keyof MetadataWorkerOperationRuleTypeMap]

export interface DependentItemDefinition {
  readonly yaml?: DependentYamlItemHandler
  readonly structural?: DependentStructuralItemHandler
  readonly imported?: DependentImportItemHandler
}

export interface MetadataSynchronizationContribution {
  readonly kind: string
}

export interface MetadataRulesDefinition<
  SynchronizationContribution extends MetadataSynchronizationContribution = MetadataSynchronizationContribution,
> {
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
  readonly schemaPropertyRefs: Readonly<
    Record<string, MetadataSchemaPropertyRefDefinition>
  >
  readonly projectSpecs: Readonly<Record<string, RegisteredProjectSpec>>
  readonly resourceTopology: readonly MetadataResourceTopologyProvider[]
  readonly validation: readonly LocalYamlValueValidationContribution[]
  readonly dataPaths: readonly RuleRegistrationContribution[]
  readonly references: readonly RuleRegistrationContribution[]
  readonly components: readonly MetadataComponentDescriptor[]
  readonly imports: readonly MetadataImportComponentDescriptor[]
  readonly synchronization: readonly SynchronizationContribution[]
  readonly operations: readonly RuleRegistrationContribution[]
  readonly workerOperations: readonly MetadataWorkerOperationContribution[]
}
