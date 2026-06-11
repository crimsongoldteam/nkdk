import { join } from "path"
import type { ConfigurationContext } from "~/metadata/context/types"
import "~/metadata/forms"
import { importClientApplicationFormFromYAML } from "~/metadata/forms/clientApplicationForm/fromYAML"
import type { ClientApplicationFormYAML } from "~/metadata/forms/clientApplicationForm/types"
import { buildFormDataPathIndex } from "./dataPath/formIndex"
import { collectFormDataPathOccurrences } from "./dataPath/formTraversal"
import {
  createOwnerMetadataCache,
  type OwnerMetadataCache,
} from "./dataPath/ownerCache"
import { resolveDataPath } from "./dataPath/resolver"
import { validateResolvedDataPathPolicy } from "./dataPath/policies"
import type { ProjectYamlCache } from "./projectYamlCache"
import type { Diagnostic } from "./types"

export interface ValidateFormParams {
  projectDir: string
  formDir: string
  formName: string
  owner: { dir: string; name: string }
  cache: ProjectYamlCache
  context?: ConfigurationContext
  ownerCache?: OwnerMetadataCache
  suppressFormImportDiagnostics?: boolean
}

export function validateForm(params: ValidateFormParams): Diagnostic[] {
  const filePath = join(params.formDir, "Форма.yaml")
  const entry = params.cache.get(filePath)
  if ("error" in entry) {
    return [
      {
        filePath: entry.filePath,
        line: 1,
        col: 1,
        severity: "error",
        source: "external-file",
        message: `Не удалось прочитать форму "${params.formName}": ${entry.error.message}`,
      },
    ]
  }

  if (entry.parsed.doc.errors.length > 0) {
    return entry.parsed.doc.errors.map((error) => {
      const position = entry.parsed.lineCounter.linePos(error.pos[0])
      return {
        filePath: entry.filePath,
        line: position.line,
        col: position.col,
        severity: "error" as const,
        source: "syntax" as const,
        message: error.message,
      }
    })
  }

  const context = params.context ?? defaultValidationContext()
  const form = importForm({ context, yaml: entry.parsed.data, filePath: entry.filePath })
  if ("diagnostics" in form) return params.suppressFormImportDiagnostics === true ? [] : form.diagnostics

  const index = buildFormDataPathIndex({
    filePath: entry.filePath,
    parsed: entry.parsed,
    form: form.value,
  })
  const diagnostics = [...index.duplicateDiagnostics]
  const ownerDiagnostics: Diagnostic[] = []
  const ownerCache = recordOwnerSchemaDiagnostics({
    cache:
      params.ownerCache ??
      createOwnerMetadataCache({
        projectDir: params.projectDir,
        yamlCache: params.cache,
        context,
      }),
    diagnostics: ownerDiagnostics,
  })

  for (const occurrence of collectFormDataPathOccurrences(form.value)) {
    const result = resolveDataPath({
      filePath: entry.filePath,
      parsed: entry.parsed,
      yamlPath: occurrence.yamlPath,
      value: occurrence.value,
      index,
      ownerCache,
      ...(occurrence.tableContext !== undefined ? { tableContext: occurrence.tableContext } : {}),
    })

    diagnostics.push(...result.diagnostics)
    if (result.status === "error" || result.target === undefined) continue

    diagnostics.push(
      ...validateResolvedDataPathPolicy({
        filePath: entry.filePath,
        parsed: entry.parsed,
        yamlPath: occurrence.yamlPath,
        value: occurrence.value,
        rule: occurrence.rule,
        target: result.target,
      }),
    )
  }

  diagnostics.push(...ownerDiagnostics)
  return dedupeDiagnostics(diagnostics)
}

function importForm(params: {
  context: ConfigurationContext
  yaml: unknown
  filePath: string
}): { value: ReturnType<typeof importClientApplicationFormFromYAML> } | { diagnostics: Diagnostic[] } {
  try {
    return {
      value: importClientApplicationFormFromYAML(params.context, params.yaml as ClientApplicationFormYAML),
    }
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught)
    return {
      diagnostics: [
        {
          filePath: params.filePath,
          line: 1,
          col: 1,
          severity: "error",
          source: "structure",
          message: `Не удалось импортировать форму: ${message}`,
        },
      ],
    }
  }
}

function recordOwnerSchemaDiagnostics(params: {
  cache: OwnerMetadataCache
  diagnostics: Diagnostic[]
}): OwnerMetadataCache {
  const seen = new Set<string>()

  return {
    get(ref) {
      const result = params.cache.get(ref)
      if (result.status === "ok") {
        for (const diagnostic of result.owner.schemaDiagnostics) {
          const key = diagnosticKey(diagnostic)
          if (seen.has(key)) continue
          seen.add(key)
          params.diagnostics.push(diagnostic)
        }
      }
      return result
    },
  }
}

function diagnosticKey(diagnostic: Diagnostic): string {
  return [
    diagnostic.filePath,
    diagnostic.line,
    diagnostic.col,
    diagnostic.source,
    diagnostic.severity,
    diagnostic.path ?? "",
    diagnostic.message,
  ].join("\0")
}

function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const result: Diagnostic[] = []
  const seen = new Set<string>()
  for (const diagnostic of diagnostics) {
    const key = diagnosticKey(diagnostic)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(diagnostic)
  }
  return result
}

function defaultValidationContext(): ConfigurationContext {
  return {
    version: "2.20",
    defaultLanguage: "ru",
    exportToYAML: { toTyped: false },
  }
}
