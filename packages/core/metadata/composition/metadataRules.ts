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

export const legacyCoreRules = composeMetadataRules(
  staticPropertyRules,
  staticFactoryRules,
  appliedObjectProjectRules,
  appliedObjectComponentRules,
  clientApplicationFormValidationRules,
  clientApplicationFormPropertyRules,
  childFormNamesPropertyRules,
  formElementCatalogRules,
  formSchemaRules,
  projectReferenceRules,
  dataPathRules,
)

const rulesWithoutTopology = composeMetadataRules(
  legacyCoreRules,
  formElementRules,
)

const resourceTopologyRules = defineMetadataRules({
  ...emptyMetadataRules,
  resourceTopology: [createMetadataResourceTopologyProvider(rulesWithoutTopology)],
})

export const metadataRules = composeMetadataRules(
  rulesWithoutTopology,
  resourceTopologyRules,
)
