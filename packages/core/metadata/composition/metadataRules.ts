import {
  composeMetadataRules,
  defineMetadataRules,
} from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { staticPropertyTypes } from "./staticPropertyRules"
import { staticFactoryRules } from "./staticFactoryRules"
import { formElementRules } from "../forms/elements/metadataRules"
import { appliedObjectProjectRules } from "../appliedObjects/projectRules"
import { appliedObjectComponentRules } from "../appliedObjects/componentRules"
import { clientApplicationFormValidationRules } from "../forms/clientApplicationForm/validationRules"

const staticPropertyRules = defineMetadataRules({
  ...emptyMetadataRules,
  propertyTypes: staticPropertyTypes,
})

export const legacyCoreRules = composeMetadataRules(
  staticPropertyRules,
  staticFactoryRules,
  appliedObjectProjectRules,
  appliedObjectComponentRules,
  clientApplicationFormValidationRules,
)

export const metadataRules = composeMetadataRules(
  legacyCoreRules,
  formElementRules,
)
