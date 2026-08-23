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
import type {
  ExplicitXMLPropertyRegistration,
  ExplicitXMLPropertyTypeRegistration,
} from "../property/explicitXMLPropertyRegistry"
import type {
  importExportFunction,
  PropertyRuleExecution,
  TypeRulesOperations,
} from "../property/fn"
import type { RegisteredSystemEnumeration } from "../property/systemEnumerationRegistry"
import type { IndexValueFromYAMLFunction } from "../property/indexValueFromYAMLRegistry"
import type { MetadataTargetOwnerResolver } from "../property/metadataTargetOwnerRegistry"
import type { MetadataItemRule } from "../property/types"
import type { MetadataItemXmlImportAugmenter } from "../metadataItem/augmenterRegistry"
import type { MetadataItemYamlToXmlAugmenter } from "../property/yamlToXmlAugmenter"
import type { BrokenXMLReferenceCarrierRegistration } from "../property/brokenXMLReferenceCarrierRegistry"
import type { FormDataPathMetadataProjection } from "../../validation/formDataPathProjection"
import type {
  FormPlatformSourceMatcher,
  FormWarningProvider,
  RegisteredFormFirstPassValidator,
  RegisteredFormSecondPassValidator,
  RegisteredFormValidator,
} from "../../validation/formValidationRegistry"
import type { FormValidationAdapter } from "../../validation/formContracts"
import type { XmlAnomalyRegistration } from "../xmlAnomaly/contracts"

export type PropertyTypeDefinition = {
  readonly [Operation in TypeRulesOperations]?: NonNullable<
    importExportFunction<Operation>
  >
}

export interface MetadataSchemaDefinition {
  readonly source?: object | string
  readonly export: (params: {
    context: ConfigurationContext
    execution?: PropertyRuleExecution
  }) => TSchema
}

export type MetadataSchemaPropertyRefDefinition = (params: {
  readonly context: ConfigurationContext
  readonly rule: import("../property/types").PropertyRule
  readonly execution?: PropertyRuleExecution
}) => TSchema | undefined

export interface RuleRegistrationContribution {
  readonly register: () => void
}

export type PropertyStateMode = "control" | "notify" | "extend" | "multi"

export interface PropertyStatePropertyCapability {
  readonly availability?: "borrowed" | "own"
  readonly modes: readonly PropertyStateMode[]
  readonly representation?: "plain" | "tagged" | "section" | "multi"
  readonly xmlName?: string
  readonly externalName?: string
}

export interface PropertyStateItemCapabilityPatch {
  readonly itemType: string
  readonly properties: Readonly<Record<string, Partial<PropertyStatePropertyCapability>>>
}

export interface PropertyStateCapabilityContribution {
  readonly kind: "propertyStateCapability"
  readonly id: string
  readonly profile?: {
    readonly properties: Readonly<Record<string, PropertyStatePropertyCapability>>
  }
  readonly item?: {
    readonly itemType: string
    readonly profiles: readonly string[]
    readonly properties?: Readonly<Record<string, PropertyStatePropertyCapability>>
  }
  readonly delta?: {
    readonly mode: string
    readonly items: readonly PropertyStateItemCapabilityPatch[]
  }
}

export interface ResolvedPropertyStateItemCapability {
  readonly itemType: string
  readonly properties: Readonly<Record<string, PropertyStatePropertyCapability>>
}

export interface PropertyStateCapabilityRegistry {
  resolve(params: {
    readonly itemType: string
    readonly propertyKey: string
    readonly compatibilityMode?: string
  }): PropertyStatePropertyCapability | undefined
  item(itemType: string, compatibilityMode?: string): ResolvedPropertyStateItemCapability | undefined
}

export interface PropertyStateCompatibilityModeResolver {
  normalize(mode: string | undefined): string
  compare(first: string, second: string): number
}

export const emptyPropertyStateCapabilityRegistry: PropertyStateCapabilityRegistry = {
  resolve: () => undefined,
  item: () => undefined,
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

export type MetadataValidationContribution =
  | LocalYamlValueValidationContribution
  | { readonly kind: "formValidator"; readonly validator: RegisteredFormValidator }
  | { readonly kind: "formValidationAdapter"; readonly adapter: FormValidationAdapter }
  | {
      readonly kind: "formValidationPasses"
      readonly firstPass: RegisteredFormFirstPassValidator
      readonly secondPass: RegisteredFormSecondPassValidator
    }
  | { readonly kind: "formDataPathProjection"; readonly projection: FormDataPathMetadataProjection }
  | { readonly kind: "formPlatformSourceMatcher"; readonly matcher: FormPlatformSourceMatcher }
  | { readonly kind: "formWarningProvider"; readonly provider: FormWarningProvider }
  | { readonly kind: "formStructureProjection"; readonly projection: MetadataFormStructureProjection }

export type MetadataFormStructureProjection = (params: {
  readonly components: readonly import("../../validation/formContracts").FormStructuredComponent[]
  readonly representation: "working" | "base"
  readonly logicalAddress: string
  readonly workingProjectPath: string
}) => readonly {
  readonly documentKind: string
  readonly representation: string
  readonly logicalAddress: string
  readonly workingProjectPath: string
  readonly componentKind: string
  readonly name: string
  readonly yamlPath: readonly (string | number)[]
  readonly payload?: string
}[]

export interface MetadataImportComponentDescriptor {
  readonly kind: string
  detect(root: Readonly<Record<string, unknown>>): boolean
  resolveRoot(root: Readonly<Record<string, unknown>>): {
    readonly address: ComponentAddress
    readonly itemName: string
  }
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

export type MetadataOperationContribution =
  | { readonly kind: "xmlImportAugmenter"; readonly name: string; readonly augmenter: MetadataItemXmlImportAugmenter }
  | { readonly kind: "yamlToXmlAugmenter"; readonly componentKind: string; readonly augmenter: MetadataItemYamlToXmlAugmenter }
  | { readonly kind: "baseFormPropertyProjector"; readonly propertyType: string; readonly projector: MetadataBaseFormProjector }
  | { readonly kind: "baseFormReferenceProjector"; readonly propertyType: string; readonly projector: MetadataBaseFormProjector }
  | { readonly kind: "importedYamlFinalizer"; readonly itemType: string; readonly finalizer: MetadataImportedYamlFinalizer }

export interface MetadataImportedYamlFinalizerParams {
  yaml: unknown
  rule: MetadataItemRule
  ownerMetadataCache: import("../../validation/dataPath/contracts").OwnerMetadataCache
  currentConfigurationYAML?: unknown
  savedBaseYAML?: unknown
}

export interface MetadataImportedYamlFinalizer {
  requiresFinalization(yaml: unknown, rule: MetadataItemRule): boolean
  finalize(params: MetadataImportedYamlFinalizerParams): void
}

export interface MetadataBaseFormProjectionContext {
  readonly attributeNames: ReadonlySet<string>
  readonly commandNames: ReadonlySet<string>
  readonly parameterNames: ReadonlySet<string>
}

export type MetadataBaseFormProjection =
  | { readonly kind: "include"; readonly value: unknown }
  | { readonly kind: "omit" }

export interface MetadataBaseFormProjector {
  project(params: {
    readonly rule: import("../property/types").PropertyRule
    readonly baseValue: unknown
    readonly extensionValue: unknown
    readonly context: MetadataBaseFormProjectionContext
  }): MetadataBaseFormProjection
}

export interface MetadataRulesDefinition<
  SynchronizationContribution extends MetadataSynchronizationContribution = MetadataSynchronizationContribution,
  ReferenceContribution extends object = never,
  DataPathContribution extends object = never,
> {
  readonly propertyTypes: Readonly<Record<string, PropertyTypeDefinition>>
  readonly propertyItemRules: Readonly<Record<string, object>>
  readonly explicitXMLProperties: Readonly<
    Record<string, ExplicitXMLPropertyRegistration>
  >
  readonly explicitXMLPropertyTypes: Readonly<
    Record<string, ExplicitXMLPropertyTypeRegistration>
  >
  readonly brokenXMLReferenceCarriers: readonly BrokenXMLReferenceCarrierRegistration[]
  readonly dependentItems: Readonly<Record<string, DependentItemDefinition>>
  readonly indexValuesFromYAML: Readonly<
    Record<string, IndexValueFromYAMLFunction>
  >
  readonly metadataTargetOwners: Readonly<
    Record<string, MetadataTargetOwnerResolver>
  >
  readonly metadataItems: Readonly<Record<string, MetadataItemRule>>
  readonly formElements: Readonly<Record<string, ElementRule>>
  readonly formElementKinds: Readonly<Record<string, string>>
  readonly systemEnumerations: Readonly<
    Record<string, RegisteredSystemEnumeration>
  >
  readonly schemas: Readonly<Record<string, MetadataSchemaDefinition>>
  readonly schemaPropertyRefs: Readonly<
    Record<string, MetadataSchemaPropertyRefDefinition>
  >
  readonly projectSpecs: Readonly<Record<string, RegisteredProjectSpec>>
  readonly resourceTopology: readonly MetadataResourceTopologyProvider[]
  readonly validation: readonly MetadataValidationContribution[]
  readonly dataPaths: readonly DataPathContribution[]
  readonly references: readonly ReferenceContribution[]
  readonly components: readonly MetadataComponentDescriptor[]
  readonly imports: readonly MetadataImportComponentDescriptor[]
  readonly synchronization: readonly SynchronizationContribution[]
  readonly operations: readonly MetadataOperationContribution[]
  readonly workerOperations: readonly MetadataWorkerOperationContribution[]
  readonly propertyStateCapabilities: readonly PropertyStateCapabilityContribution[]
  readonly xmlAnomalies: readonly XmlAnomalyRegistration[]
}
