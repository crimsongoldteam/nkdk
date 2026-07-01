import type { ConfigurationContext } from "~/metadata/context/types"

export function defaultMetadataOperationsContext(): ConfigurationContext {
  return {
    defaultLanguage: "ru",
    version: "2.20",
    exportToYAML: { toTyped: false },
  }
}
