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
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { resolveDataPathCore } from "../../validation/dataPath/coreResolver"
import { classifyTableSource } from "./tableSourceProfile"
import type { FormDataPathContext } from "./formDataPathContext"

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
      normalizeImportedRowFilterMarkers({ yaml: form, context: dataPathContext, ownerCache: ownerMetadataCache })
    },
    },
  }],
})

export function normalizeImportedRowFilterMarkers(params: {
  yaml: ClientApplicationFormYAML
  context: FormDataPathContext
  ownerCache: OwnerMetadataCache
}): void {
  for (const element of params.context.elementsByName.values()) {
    if (element.elementType !== "Table") continue
    const table = recordAtPath(params.yaml, element.yamlPath)
    if (table === undefined || yamlScalarTagAt(table, "ОтборСтрок") !== "xml") continue
    const dataPath = typeof element.value === "string" && element.value.trim().length > 0
      ? element.value
      : element.candidateYaml
    const profile = classifyTableSource({
      dataPath,
      index: params.context.index,
      resolve: (value) => resolveDataPathCore({
        value,
        nameMode: "yaml",
        index: params.context.index,
        ownerCache: params.ownerCache,
      }),
    })
    if (profile !== "none") delete table["ОтборСтрок"]
  }
}

function hasTaggedRowFilter(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasTaggedRowFilter)
  if (value === null || typeof value !== "object") return false
  const record = value as Record<string, unknown>
  if (yamlScalarTagAt(record, "ОтборСтрок") === "xml") return true
  return Object.values(record).some(hasTaggedRowFilter)
}

function recordAtPath(root: unknown, path: readonly (string | number)[]): Record<string, unknown> | undefined {
  let current = root
  for (const part of path) {
    if (current === null || typeof current !== "object") return undefined
    current = (current as Record<string | number, unknown>)[part]
  }
  return current !== null && typeof current === "object" && !Array.isArray(current)
    ? current as Record<string, unknown>
    : undefined
}

function clientApplicationFormYaml(value: unknown): ClientApplicationFormYAML {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Импортированный YAML формы не является объектом")
  }
  return value as ClientApplicationFormYAML
}
