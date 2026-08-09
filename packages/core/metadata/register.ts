import "./appliedObjects/configuration/register"
import "./appliedObjects/configurationExtension/register"
import { registerCommonObjects } from "./commonObjects"
import { registerForms } from "./forms"
import { registerAppliedObjects } from "./appliedObjects"
import { registerValidationMetadata } from "./validation/registerValidationMetadata"
import { getRegisteredProjectSpecs } from "./projectDefinition/projectSpecRegistry"
import { registerMetadataProjectSpecs } from "./projectDefinition/specs"
import { metadataResourceTopologyProvider } from "./resourceTopology/adapters/metadataProvider"
import { registerMetadataResourceTopologyProvider } from "./resourceTopology/core/providerRegistry"
import "./ruleRuntime/appliedObject/syncToXML"

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
