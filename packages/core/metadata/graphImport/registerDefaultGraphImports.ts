import { registerFormGraphImport } from "./registerFormGraphImport"
import { registerTopLevelGraphImports } from "./registerTopLevelGraphImports"

export function ensureDefaultGraphImportsRegistered(): void {
  registerTopLevelGraphImports()
  registerFormGraphImport()
}
