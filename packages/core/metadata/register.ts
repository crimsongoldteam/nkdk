import "./appliedObjects/configuration/register"
import { registerCommonObjects } from "./commonObjects"
import { registerForms } from "./forms"
import { registerAppliedObjects } from "./appliedObjects"
import "./orchestration/appliedObject/syncToXML"

let coreMetadataRegistered = false

export function registerCoreMetadata(): void {
  if (coreMetadataRegistered) return
  coreMetadataRegistered = true

  registerCommonObjects()
  registerForms()
  registerAppliedObjects()
}
