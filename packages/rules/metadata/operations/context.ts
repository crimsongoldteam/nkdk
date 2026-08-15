import { createConfigurationLanguages, type ConfigurationContext } from "@nkdk/runtime"

export function defaultMetadataOperationsContext(): ConfigurationContext {
  return {
    languages: createConfigurationLanguages({ default: "ru", registered: ["ru"] }),
    version: "2.20",
    exportToYAML: { toTyped: false },
  }
}
