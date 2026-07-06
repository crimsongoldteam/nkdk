import { registerCoreMetadata } from "../register"

let registered = false

export function registerValidationMetadata(): void {
  if (registered) return
  registered = true
  registerCoreMetadata()
}
