import { registerTopLevelGraphImports } from "./registerTopLevelGraphImports"

export function ensureDefaultGraphImportsRegistered(): void {
  registerTopLevelGraphImports()
}
