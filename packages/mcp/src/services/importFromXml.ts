import { loadCoreApi, type CoreProjectStateService } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type ImportFromXmlInput } from "../contracts/importFromXml"
import { resolveComponent } from "./componentResolver"
import { projectStateHandle } from "./projectStateHandle"
import { withDiagnosticOutput, type DiagnosticReportFileSystem } from "./diagnosticReport"
import type { DiagnosticReportReference, DiagnosticSummary } from "../contracts/diagnostics"
import type { ConfigurationLanguages } from "@nkdk/runtime"
import { defaultMcpConfigurationLanguages } from "../configurationContext"

interface CoreImportDiagnostic {
  severity: "error" | "warning"
  code: string
  message: string
  targetProjectPath: string
  sourcePath?: string
  value?: string
}

interface CoreImportResult {
  componentPath?: string
  succeeded: number
  failed: CoreImportDiagnostic[]
  warnings: CoreImportDiagnostic[]
  configurationIndexPath?: string
}

interface ImportFromXmlDeps {
  projectState?: CoreProjectStateService
  diagnosticReportFileSystem?: DiagnosticReportFileSystem
  importConfigurationFromXml: (params: {
    context: {
      languages: ConfigurationLanguages
      version: "2.20"
      exportToYAML: { toTyped: false }
      fromXML: { forReference: false }
    }
    inputDir: string
    projectDir: string
    requestedComponentPath?: string
    concurrency?: number
    projectState: CoreProjectStateService
  }) => Promise<CoreImportResult>
}

export type ImportFromXmlPayload = ToolPayload<{
  componentPath: string
  succeeded: number
  failed: Array<{ severity: "error"; code: string; message: string; targetProjectPath?: string }>
  warnings: Array<{ code: string; message: string; targetProjectPath?: string }>
  configurationIndexPath?: string
  diagnostics: readonly ImportOutputDiagnostic[]
  summary: DiagnosticSummary
  truncated: boolean
  report?: DiagnosticReportReference
}>

interface ImportOutputDiagnostic {
  readonly severity: "error" | "warning"
  readonly message: string
  readonly code: string
  readonly targetProjectPath?: string
}

export async function importFromXml(
  input: ImportFromXmlInput,
  deps?: ImportFromXmlDeps,
): Promise<ImportFromXmlPayload> {
  if (input.allowWrite !== true) {
    return toolError("confirmation_required", "import_from_xml пишет YAML-файлы; повторите вызов с allowWrite=true", {
      xmlDir: input.xmlDir,
      projectDir: input.projectDir,
      ...(input.componentPath === undefined ? {} : { componentPath: input.componentPath }),
    })
  }

  try {
    const project = resolveComponent({ projectDir: input.projectDir })
    if (!project.ok) return project.error

    const core = deps ?? (await loadCoreApi())
    const projectState = deps?.projectState ?? await projectStateHandle.get()
    const result = await core.importConfigurationFromXml({
      context: {
        languages: defaultMcpConfigurationLanguages,
        version: "2.20",
        exportToYAML: { toTyped: false },
        fromXML: { forReference: false },
      },
      inputDir: input.xmlDir,
      projectDir: project.projectDir,
      projectState,
      ...(input.componentPath === undefined ? {} : { requestedComponentPath: input.componentPath }),
      ...(input.concurrency === undefined ? {} : { concurrency: input.concurrency }),
    })

    return await withDiagnosticOutput({
      projectDir: project.projectDir,
      operation: "import",
      operationId: `${Date.now()}-${Math.random()}`,
      diagnostics: concatenate(result.failed, result.warnings),
      ...(deps?.diagnosticReportFileSystem === undefined ? {} : { fileSystem: deps.diagnosticReportFileSystem }),
      map: mapDiagnostic,
      build(output): ImportFromXmlPayload {
        const failed = output.diagnostics.filter(isImportError).map(mapFailureOutput)
        const warnings = output.diagnostics.filter(isImportWarning).map(mapWarningOutput)
        const details = {
          succeeded: result.succeeded,
          ...output,
          failed,
          warnings,
          ...(result.configurationIndexPath === undefined
            ? {}
            : { configurationIndexPath: result.configurationIndexPath }),
        }
        if (result.componentPath === undefined) {
          return toolError(
            "core_error",
            result.failed.find((failure) => failure.severity === "error")?.message ?? "Не удалось определить компонент XML-выгрузки",
            details,
          )
        }
        return toolSuccess({ componentPath: result.componentPath, ...details })
      },
    })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}

function* concatenate<T>(...sources: readonly (readonly T[])[]): Iterable<T> {
  for (const source of sources) yield* source
}

function mapDiagnostic(diagnostic: CoreImportDiagnostic): ImportOutputDiagnostic {
  return {
    severity: diagnostic.severity,
    code: diagnostic.code,
    message: diagnostic.message,
    ...(diagnostic.targetProjectPath.length === 0 ? {} : { targetProjectPath: diagnostic.targetProjectPath }),
  }
}

function isImportError(diagnostic: ImportOutputDiagnostic): boolean {
  return diagnostic.severity === "error"
}

function isImportWarning(diagnostic: ImportOutputDiagnostic): boolean {
  return diagnostic.severity === "warning"
}

function mapFailureOutput(failure: ImportOutputDiagnostic): {
  severity: "error"
  code: string
  message: string
  targetProjectPath?: string
} {
  return {
    severity: "error",
    code: failure.code,
    message: failure.message,
    ...(failure.targetProjectPath === undefined ? {} : { targetProjectPath: failure.targetProjectPath }),
  }
}

function mapWarningOutput(warning: ImportOutputDiagnostic): {
  code: string
  message: string
  targetProjectPath?: string
} {
  return {
    code: warning.code ?? "",
    message: warning.message,
    ...(warning.targetProjectPath === undefined ? {} : { targetProjectPath: warning.targetProjectPath }),
  }
}
