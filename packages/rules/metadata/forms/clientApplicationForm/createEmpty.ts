import type { ClientApplicationForm } from "./types"

export function createEmptyClientApplicationForm(): ClientApplicationForm {
  return {
    itemType: "ClientApplicationForm",
    childItems: [],
    commands: [],
  }
}
