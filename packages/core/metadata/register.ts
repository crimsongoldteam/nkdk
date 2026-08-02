import "./appliedObjects/configuration/register"
import "./appliedObjects/configurationExtension/register"
import { registerCommonObjects } from "./commonObjects"
import { registerForms } from "./forms"
import { registerAppliedObjects } from "./appliedObjects"
import "./orchestration/appliedObject/syncToXML"
import { markRegisteredTypeRulesAsCoreForCompatibility } from "./orchestration/property/typeRuleCompatibilityIdentity"

markRegisteredTypeRulesAsCoreForCompatibility()

let coreMetadataRegistered = false

export function registerCoreMetadata(): void {
  if (coreMetadataRegistered) return
  coreMetadataRegistered = true

  registerCommonObjects()
  registerForms()
  registerAppliedObjects()
}
