import { registerMetadataItemImportedYamlFinalizer } from "../../ruleRuntime/metadataItem/importedYamlFinalizerRegistry"
import type { ClientApplicationFormYAML } from "./types"
import {
  compactImportedFormDataPaths,
  prepareFormDataPathContextFromYAML,
  requiresImportedFormDataPathCompaction,
} from "./formDataPathContext"
import { ClientApplicationFormRules } from "./rules"

registerMetadataItemImportedYamlFinalizer(
  ClientApplicationFormRules.itemType,
  {
    requiresFinalization: (yaml, rule) =>
      requiresImportedFormDataPathCompaction(clientApplicationFormYaml(yaml), rule),
    finalize: ({ yaml, rule, ownerMetadataCache, currentConfigurationYAML, savedBaseYAML }) => {
      const form = clientApplicationFormYaml(yaml)
      compactImportedFormDataPaths({
        yaml: form,
        context: prepareFormDataPathContextFromYAML({
          yaml: form,
          ...(currentConfigurationYAML === undefined
            ? {}
            : { currentConfigurationFormYaml: clientApplicationFormYaml(currentConfigurationYAML) }),
          ...(savedBaseYAML === undefined
            ? {}
            : { savedBaseFormYaml: clientApplicationFormYaml(savedBaseYAML) }),
          ownerCache: ownerMetadataCache,
          rule,
        }),
      })
    },
  }
)

function clientApplicationFormYaml(value: unknown): ClientApplicationFormYAML {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Импортированный YAML формы не является объектом")
  }
  return value as ClientApplicationFormYAML
}
