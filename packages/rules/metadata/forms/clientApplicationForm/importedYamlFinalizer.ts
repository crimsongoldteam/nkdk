import type { ClientApplicationFormYAML } from "./types"
import { yamlScalarTagAt } from "@nkdk/runtime"
import {
  compactImportedFormDataPaths,
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
      return requiresImportedFormDataPathCompaction(form, rule) || hasTaggedRowFilter(form)
    },
    finalize: ({ yaml, rule, ownerMetadataCache, currentConfigurationYAML, savedBaseYAML }) => {
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
      compactImportedFormDataPaths({
        yaml: form,
        context: dataPathContext,
      })
    },
    },
  }],
})

function hasTaggedRowFilter(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasTaggedRowFilter)
  if (value === null || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  if (yamlScalarTagAt(record, "ОтборСтрок") === "xml") return true
  return Object.values(record).some(hasTaggedRowFilter)
}

function clientApplicationFormYaml(value: unknown): ClientApplicationFormYAML {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Импортированный YAML формы не является объектом")
  }
  return value as ClientApplicationFormYAML
}
