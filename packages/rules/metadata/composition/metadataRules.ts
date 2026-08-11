import {
  composeMetadataRules,
  defineMetadataRules,
} from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { staticPropertyTypes } from "./staticPropertyRules"
import { staticFactoryRules } from "./staticFactoryRules"
import { formElementRules } from "../forms/elements/metadataRules"
import { defineAppliedObjectProjectRules } from "../appliedObjects/projectRules"
import { appliedObjectComponentRules } from "../appliedObjects/componentRules"
import { clientApplicationFormValidationRules } from "../forms/clientApplicationForm/validationRules"
import { clientApplicationFormPropertyRules } from "../forms/clientApplicationForm/propertyTypeRules"
import { childFormNamesPropertyRules } from "../forms/clientApplicationForm/childFormNamesPropertyRules"
import { createMetadataResourceTopologyProvider } from "../resourceTopology/adapters/metadataProvider"
import { defineFormSchemaRules } from "../forms/schemaRegister"
import { formElementCatalogRules } from "../forms/elements/formElementCatalog"
import { metadataTargetProjectReferenceRules } from "../commonObjects/metadataTargetProjectResolvers/referenceRules"
import { metadataSubsystemReferenceRules } from "../appliedObjects/metadataSubsystem/referenceRules"
import { metadataExternalDataSourceReferenceRules } from "../appliedObjects/metadataExternalDataSource/referenceRules"
import { metadataEnumerationReferenceRules } from "../appliedObjects/metadataEnumeration/referenceRules"
import { metadataCatalogReferenceRules } from "../appliedObjects/metadataCatalog/referenceRules"
import { metadataDocumentReferenceRules } from "../appliedObjects/metadataDocument/referenceRules"
import { configurationReferenceRules } from "../appliedObjects/configuration/referenceRules"
import { appliedObjectDataPathRules } from "../appliedObjects/dataPathRules"
import { configurationExtensionOperationRules } from "../appliedObjects/configurationExtension/operationRules"
import { createMetadataRuntime as createRulesMetadataRuntime } from "../runtime/createMetadataRuntime"
import type { MetadataRuntime, MetadataWorkerManifest } from "@nkdk/runtime"
import type { MetadataRuntime as RulesMetadataRuntime } from "../runtime/contracts"
import type {} from "../forms/clientApplicationForm/context.types"
import type {} from "../commonObjects/formattedI8nText/registry.types"
import type {} from "../commonObjects/i8nText/registry.types"
import type {} from "../commonObjects/userVisible/registry.types"
import type {} from "../fullSyncToXml/worker"
import type {} from "../importFromXml/worker"
import type {} from "../project/workerOperation.types"
import type {} from "../workerPool/projectQueries"
import { createDefaultProjectStateService } from "./projectState"

const staticPropertyRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: staticPropertyTypes,
})

const appliedObjectProjectRules = defineAppliedObjectProjectRules(
  staticFactoryRules.metadataItems,
)
const formSchemaRules = defineFormSchemaRules(
  formElementRules.formElements,
  formElementCatalogRules.formElementKinds,
)
const projectReferenceRules = defineMetadataRules({
  ...emptyMetadataRules,
  references: [
    ...metadataTargetProjectReferenceRules,
    ...metadataSubsystemReferenceRules,
    ...metadataExternalDataSourceReferenceRules,
    ...metadataEnumerationReferenceRules,
    ...metadataCatalogReferenceRules,
    ...metadataDocumentReferenceRules,
    ...configurationReferenceRules,
  ],
})
const dataPathRules = defineMetadataRules({
  ...emptyMetadataRules,
  dataPaths: appliedObjectDataPathRules,
})
const operationRules = defineMetadataRules({
  ...emptyMetadataRules,
  operations: configurationExtensionOperationRules,
})

export const legacyCoreRules = composeMetadataRules(
  staticFactoryRules,
  staticPropertyRules,
  appliedObjectProjectRules,
  appliedObjectComponentRules,
  clientApplicationFormValidationRules,
  clientApplicationFormPropertyRules,
  childFormNamesPropertyRules,
  formElementCatalogRules,
  formSchemaRules,
  projectReferenceRules,
  dataPathRules,
  operationRules,
)

const rulesWithoutTopology = composeMetadataRules(
  legacyCoreRules,
  formElementRules,
)

const resourceTopologyRules = defineMetadataRules({
  ...emptyMetadataRules,
  resourceTopology: [createMetadataResourceTopologyProvider(rulesWithoutTopology)],
})

const composedMetadataRules = composeMetadataRules(
  rulesWithoutTopology,
  resourceTopologyRules,
)

export const metadataRules = Object.assign(composedMetadataRules, {
  createRuntime(options: { readonly workers: MetadataWorkerManifest }): MetadataRuntime {
    return adaptRulesMetadataRuntime(createRulesMetadataRuntime({
      rules: composedMetadataRules,
      workers: options.workers,
      createProjectStateService: createDefaultProjectStateService,
    }))
  },
})

function adaptRulesMetadataRuntime(runtime: RulesMetadataRuntime): MetadataRuntime {
  return runtime as unknown as MetadataRuntime
}
