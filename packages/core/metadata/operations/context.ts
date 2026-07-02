import type { ConfigurationContext } from "../context/types"

export function defaultMetadataOperationsContext(): ConfigurationContext {
  return {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
  }
}
