import "../appliedObjects/configuration/register"
import "../appliedObjects/configurationExtension/register"
import { registerCommonObjects } from "../commonObjects"
import { registerForms } from "../forms"
import { registerAppliedObjects } from "../appliedObjects"
import { registerValidationMetadata } from "../validation/registerValidationMetadata"
import { getRegisteredProjectSpecs } from "../projectDefinition/projectSpecRegistry"
import { registerMetadataProjectSpecs } from "../projectDefinition/specs"
import { metadataResourceTopologyProvider } from "../resourceTopology/adapters/metadataProvider"
import { registerMetadataResourceTopologyProvider } from "../resourceTopology/core/providerRegistry"
import "../ruleRuntime/appliedObject/syncToXML"
import { legacyCoreRules } from "./metadataRules"
import { registerLegacyRuleDefinitions } from "../ruleRuntime/definition/legacyRuleRegistration"
import { registerLegacyProjectSpecDefinitions } from "../projectDefinition/projectSpecRegistry"
import { registerMetadataComponentDescriptor } from "../components/descriptor"
import { registerXmlImportComponentDescriptor } from "../importFromXml/componentDescriptor"
import { registerFullXmlSyncComponentProfile } from "../fullSyncToXml/componentProfile"

let coreMetadataRegistered = false

export interface MetadataRegistrationLayers {
  commonObjects(): void
  forms(): void
  appliedObjects(): void
  validationAdapters(): void
}

export function registerMetadataLayers(layers: MetadataRegistrationLayers): void {
  layers.commonObjects()
  layers.forms()
  layers.appliedObjects()
  layers.validationAdapters()
}

export function registerCoreMetadata(): void {
  if (coreMetadataRegistered) return
  coreMetadataRegistered = true

  registerLegacyRuleDefinitions(legacyCoreRules)
  registerLegacyProjectSpecDefinitions(legacyCoreRules.projectSpecs)
  for (const descriptor of legacyCoreRules.components) {
    registerMetadataComponentDescriptor(descriptor)
  }
  for (const descriptor of legacyCoreRules.imports) {
    registerXmlImportComponentDescriptor(descriptor)
  }
  for (const profile of legacyCoreRules.synchronization) {
    registerFullXmlSyncComponentProfile(profile)
  }

  registerMetadataLayers({
    commonObjects: registerCommonObjects,
    forms: registerForms,
    appliedObjects: registerAppliedObjects,
    validationAdapters: () => {
      const projectSpecs = getRegisteredProjectSpecs()
      registerMetadataProjectSpecs(projectSpecs)
      registerValidationMetadata(projectSpecs)
    },
  })
  registerMetadataResourceTopologyProvider(metadataResourceTopologyProvider)
}
