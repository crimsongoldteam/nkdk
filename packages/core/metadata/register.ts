import "./appliedObjects/configuration/register"
import "./appliedObjects/configurationExtension/register"
import { registerCommonObjects } from "./commonObjects"
import { registerForms } from "./forms"
import { registerAppliedObjects } from "./appliedObjects"
import { registerFillValueImport, registerFillValueStructuralReferences } from "./commonObjects/fillValue/register"
import "./orchestration/appliedObject/syncToXML"

let coreMetadataRegistered = false

export function registerCoreMetadata(): void {
  if (coreMetadataRegistered) return
  coreMetadataRegistered = true

  registerCommonObjects()
  registerFillValueStructuralReferences()
  registerFillValueImport()
  registerForms()
  registerAppliedObjects()
}
