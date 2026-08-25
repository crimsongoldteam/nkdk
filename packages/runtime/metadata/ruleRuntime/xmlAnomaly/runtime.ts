import type { XmlAnomalyLocation } from "./contracts"
import type { XmlAnomalyRegistry } from "./registry"

export interface XmlAnomalyRuntime {
  requiresImportant(location: XmlAnomalyLocation): boolean
}

export function createXmlAnomalyRuntime(
  registry: XmlAnomalyRegistry,
): XmlAnomalyRuntime {
  return {
    requiresImportant(location) {
      return registry.resolve(location)?.kind === "important"
    },
  }
}
