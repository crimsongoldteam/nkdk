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

const staticPropertyRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: staticPropertyTypes,
})

const appliedObjectProjectRules = defineAppliedObjectProjectRules(
  staticFactoryRules.metadataItems,
)

export const legacyCoreRules = composeMetadataRules(
  staticPropertyRules,
  staticFactoryRules,
  appliedObjectProjectRules,
  appliedObjectComponentRules,
  clientApplicationFormValidationRules,
  clientApplicationFormPropertyRules,
  childFormNamesPropertyRules,
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
