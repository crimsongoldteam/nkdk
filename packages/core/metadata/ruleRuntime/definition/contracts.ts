import type { TSchema } from "typebox"

import type { MetadataComponentDescriptor } from "../../components/descriptor"
import type { ConfigurationContext } from "../../context/types"
import type { FullXmlSyncComponentProfile } from "../../fullSyncToXml/componentProfile"
import type { XmlImportComponentDescriptor } from "../../importFromXml/componentDescriptor"
import type { RegisteredProjectSpec } from "../../projectDefinition/projectSpecContracts"
import type { MetadataResourceTopologyProvider } from "../../resourceTopology/core/providerRegistry"
import type {
  MetadataWorkerOperationHandler,
  MetadataWorkerOperationResetHandler,
} from "../../workerPool/operationRegistry"
import type { MetadataWorkerOperationTypeMap } from "../../workerPool/types"
import type { ElementRule } from "../formElement/types"
import type {
  importExportFunction,
  TypeRulesOperations,
} from "../property/fn"
import type { RegisteredSystemEnumeration } from "../property/systemEnumerationRegistry"
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

export type MetadataWorkerOperationRegistration = {
  readonly [Kind in keyof MetadataWorkerOperationTypeMap]: {
    readonly kind: Kind
    readonly handler: MetadataWorkerOperationHandler<Kind>
    readonly reset?: MetadataWorkerOperationResetHandler
  }
}[keyof MetadataWorkerOperationTypeMap]

export interface MetadataRulesDefinition {
  readonly propertyTypes: Readonly<Record<string, PropertyTypeDefinition>>
  readonly metadataItems: Readonly<Record<string, MetadataItemRule>>
  readonly formElements: Readonly<Record<string, ElementRule>>
  readonly systemEnumerations: Readonly<
    Record<string, RegisteredSystemEnumeration>
  >
  readonly schemas: Readonly<Record<string, MetadataSchemaDefinition>>
  readonly projectSpecs: Readonly<Record<string, RegisteredProjectSpec>>
  readonly resourceTopology: readonly MetadataResourceTopologyProvider[]
  readonly validation: readonly RuleRegistrationContribution[]
  readonly dataPaths: readonly RuleRegistrationContribution[]
  readonly references: readonly RuleRegistrationContribution[]
  readonly components: readonly MetadataComponentDescriptor[]
  readonly imports: readonly XmlImportComponentDescriptor[]
  readonly synchronization: readonly FullXmlSyncComponentProfile[]
  readonly operations: readonly RuleRegistrationContribution[]
  readonly workerOperations: readonly MetadataWorkerOperationRegistration[]
}
