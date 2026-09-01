import type { ClientApplicationFormYAML } from "./types"
import {
  compactImportedFormDataPaths,
  materializeInheritedRootFormDataPaths,
  prepareFormDataPathContextFromYAML,
  requiresImportedFormDataPathCompaction,
} from "./formDataPathContext"
import { ClientApplicationFormRules } from "./rules"
import { defineMetadataRules } from "../../ruleRuntime/definition"
import { emptyMetadataRules } from "../../ruleRuntime/definition/testSupport"

export const clientApplicationFormImportedYamlFinalizerRules = defineMetadataRules({
  ...emptyMetadataRules,
  operations: [{
    kind: "importedYamlFinalizer",
    itemType: ClientApplicationFormRules.itemType,
    finalizer: {
    requiresFinalization: (yaml, rule) => {
      const form = clientApplicationFormYaml(yaml)
      return requiresImportedFormDataPathCompaction(form, rule)
    },
    finalize: ({ yaml, rule, ownerMetadataCache, annotations, currentConfigurationYAML, savedBaseYAML }) => {
      const form = clientApplicationFormYaml(yaml)
      const dataPathContext = prepareFormDataPathContextFromYAML({
        yaml: form,
        ...(currentConfigurationYAML === undefined
          ? {}
          : { currentConfigurationFormYaml: clientApplicationFormYaml(currentConfigurationYAML) }),
        ...(savedBaseYAML === undefined
          ? {}
          : { savedBaseFormYaml: clientApplicationFormYaml(savedBaseYAML) }),
        ownerCache: ownerMetadataCache,
        rule,
      })
      const materialized = materializeInheritedRootFormDataPaths({
        yaml: form,
        context: dataPathContext,
      })
      for (const { parent, key } of materialized) {
        annotations?.set(parent, key, {
          kind: "invalid",
          occurrence: 1,
          target: "value",
        })
      }
      compactImportedFormDataPaths({
        yaml: form,
        context: dataPathContext,
      })
    },
    },
  }],
})

function clientApplicationFormYaml(value: unknown): ClientApplicationFormYAML {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Импортированный YAML формы не является объектом")
  }
  return value as ClientApplicationFormYAML
}
