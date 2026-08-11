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
import { fillValueRules } from "../commonObjects/fillValue/register"
import { metadataAttributeCollectionRules } from "../commonObjects/metadataAttribute/register"
import { metadataTabularSectionCollectionRules } from "../commonObjects/metadataTabularSection/register"
import { formElementCollectionRules } from "../forms/elements/collectionRules"
import { defineOwnerFactCollectorRules } from "../validation/registerValidationMetadata"
import { systemEnumerationRules } from "../systemEnumerations/metadataRules"
import { metadataRegisterAttributeCollectionRules } from "../commonObjects/metadataRegisterAttribute/register"
import { metadataRegisterDimensionCollectionRules } from "../commonObjects/metadataRegisterDimension/register"
import { metadataRegisterResourceCollectionRules } from "../commonObjects/metadataRegisterResource/register"
import { eventBaseFormProjectionRules } from "../forms/commonObjects/event/baseFormProjection"
import { dataPathBaseFormProjectionRules } from "../forms/commonObjects/dataPath/baseFormProjection"
import { commandNameBaseFormProjectionRules } from "../forms/commonObjects/commandName/baseFormProjection"
import { commandInterfaceBaseFormProjectionRules } from "../forms/commonObjects/commandInterface/baseFormProjection"
import { clientApplicationFormResourceCapabilityRules } from "../forms/clientApplicationForm/propertyRules"
import { childFormNamesResourceCapabilityRules } from "../forms/clientApplicationForm/childFormNamesResourceAdapter"
import { helpResourceCapabilityRules } from "../commonObjects/help/toXML"
import { configurationResourceCapabilityRules } from "../appliedObjects/configuration/register"
import { commonObjectExternalTransferCapabilityRules } from "../commonObjects/resourceTopology"
import { appliedObjectResourceCapabilityRules } from "../ruleRuntime/appliedObject/syncToXML"
import { clientApplicationFormImportedYamlFinalizerRules } from "../forms/clientApplicationForm/importedYamlFinalizer"

const staticPropertyRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: staticPropertyTypes,
})

const appliedObjectProjectRules = defineAppliedObjectProjectRules(
  staticFactoryRules.metadataItems,
)
const ownerFactCollectorRules = defineOwnerFactCollectorRules(
  Object.values(appliedObjectProjectRules.projectSpecs),
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
  systemEnumerationRules,
  appliedObjectProjectRules,
  ownerFactCollectorRules,
  appliedObjectComponentRules,
  clientApplicationFormValidationRules,
  clientApplicationFormPropertyRules,
  childFormNamesPropertyRules,
  fillValueRules,
  metadataAttributeCollectionRules,
  metadataTabularSectionCollectionRules,
  metadataRegisterAttributeCollectionRules,
  metadataRegisterDimensionCollectionRules,
  metadataRegisterResourceCollectionRules,
  formElementCollectionRules,
  formElementCatalogRules,
  formSchemaRules,
  projectReferenceRules,
  dataPathRules,
  operationRules,
  eventBaseFormProjectionRules,
  dataPathBaseFormProjectionRules,
  commandNameBaseFormProjectionRules,
  commandInterfaceBaseFormProjectionRules,
  clientApplicationFormResourceCapabilityRules,
  childFormNamesResourceCapabilityRules,
  helpResourceCapabilityRules,
  configurationResourceCapabilityRules,
  commonObjectExternalTransferCapabilityRules,
  appliedObjectResourceCapabilityRules,
  clientApplicationFormImportedYamlFinalizerRules,
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
      createProjectStateService: (stateOptions, rules) =>
        createDefaultProjectStateService(stateOptions, rules),
    }))
  },
})

function adaptRulesMetadataRuntime(runtime: RulesMetadataRuntime): MetadataRuntime {
  return runtime as unknown as MetadataRuntime
}
