import type { ConfigurationContext } from "../context/types"

export interface YAMLImportDiagnosticContext {
  sourceFile?: string
  objectPath?: string
  propertyPath?: string[]
  yamlPath?: string[]
}

export class YAMLImportError extends Error {
  readonly cause: unknown
  readonly diagnostics: YAMLImportDiagnosticContext

  constructor(error: unknown, diagnostics: YAMLImportDiagnosticContext) {
    const causeMessage = error instanceof Error ? error.message : String(error)
    super(formatYAMLImportErrorMessage(diagnostics, causeMessage))
    this.name = "YAMLImportError"
    this.cause = error
    this.diagnostics = diagnostics
  }
}

export function getYAMLImportDiagnostics(context: ConfigurationContext): YAMLImportDiagnosticContext {
  return context.importFromYAML?.diagnostics ?? {}
}

export function withYAMLImportDiagnostics(
  context: ConfigurationContext,
  diagnostics: YAMLImportDiagnosticContext
): ConfigurationContext {
  const current = getYAMLImportDiagnostics(context)

  return {
    ...context,
    importFromYAML: {
      ...context.importFromYAML,
      diagnostics: {
        sourceFile: diagnostics.sourceFile ?? current.sourceFile,
        objectPath: diagnostics.objectPath ?? current.objectPath,
        propertyPath: [...(current.propertyPath ?? []), ...(diagnostics.propertyPath ?? [])],
        yamlPath: [...(current.yamlPath ?? []), ...(diagnostics.yamlPath ?? [])],
      },
    },
  }
}

export function toYAMLImportError(error: unknown, context: ConfigurationContext): Error {
  if (error instanceof YAMLImportError) return error
  return new YAMLImportError(error, getYAMLImportDiagnostics(context))
}

function formatYAMLImportErrorMessage(diagnostics: YAMLImportDiagnosticContext, causeMessage: string): string {
  const lines = ["Ошибка YAML-импорта:"]
  if (diagnostics.sourceFile) lines.push(`  файл: ${diagnostics.sourceFile}`)
  if (diagnostics.objectPath) lines.push(`  объект: ${diagnostics.objectPath}`)
  if (diagnostics.propertyPath && diagnostics.propertyPath.length > 0) {
    lines.push(`  путь: ${diagnostics.propertyPath.join(".")}`)
  }
  if (diagnostics.yamlPath && diagnostics.yamlPath.length > 0) {
    lines.push(`  YAML-путь: ${diagnostics.yamlPath.join(".")}`)
  }
  lines.push(`  причина: ${causeMessage}`)
  return lines.join("\n")
}
