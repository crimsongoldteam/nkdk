import { registerCommonObjects } from "./commonObjects"
import { registerForms } from "./forms"
import { registerAppliedObjects } from "./appliedObjects"

let coreMetadataRegistered = false

export function registerCoreMetadata(): void {
  if (coreMetadataRegistered) return
  coreMetadataRegistered = true

  registerCommonObjects()
  registerForms()
  registerAppliedObjects()
}
