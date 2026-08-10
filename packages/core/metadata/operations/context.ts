import type { ConfigurationContext } from "@nkdk/runtime"

export function defaultMetadataOperationsContext(): ConfigurationContext {
  return {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
  }
}
