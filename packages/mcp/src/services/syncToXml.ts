import { loadCoreApi, type CoreApi, type CoreProjectStateService } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type SyncToXmlInput } from "../contracts/syncToXml"
import { resolveComponent } from "./componentResolver"
import { projectStateHandle } from "./projectStateHandle"
import { withDiagnosticOutput } from "./diagnosticReport"
import type { DiagnosticReportReference, DiagnosticSummary } from "../contracts/diagnostics"
import { defaultMcpConfigurationLanguages } from "../configurationContext"

interface SyncToXmlDeps {
  readonly projectState?: CoreProjectStateService
  readonly planSyncToXml?: CoreApi["planSyncToXml"]
  readonly syncConfigurationToXML: CoreApi["syncConfigurationToXML"]
}

export type SyncToXmlPayload = ToolPayload<{
  result?: unknown
  succeeded?: number
  configurationIndexPath?: string
  warnings?: Array<{ severity: "warning"; code: string; message: string }>
  failed?: Array<{ severity: "error"; code: string; message: string }>
  diagnostics: readonly SyncOutputDiagnostic[]
  summary: DiagnosticSummary
  truncated: boolean
  report?: DiagnosticReportReference
}>

interface SyncOutputDiagnostic {
  readonly severity: "error" | "warning"
  readonly code: string
  readonly message: string
  readonly sourceProjectPath?: string
  readonly sourcePath?: string
  readonly targetXmlPath?: string
  readonly line?: number
  readonly col?: number
}

export async function syncToXml(input: SyncToXmlInput, deps?: SyncToXmlDeps): Promise<SyncToXmlPayload> {
  try {
    if (input.componentPath === "cfe") {
      return toolError("invalid_arguments", "Ожидался путь cfe/<Имя>", {
        componentPath: input.componentPath,
      })
    }
    const component = resolveComponent({
      projectDir: input.projectDir,
      componentPath: input.componentPath,
    })
    if (!component.ok) return component.error

    const loadedCore = deps === undefined ? await loadCoreApi() : undefined
    const core = deps ?? loadedCore!
    const projectState = deps?.projectState ?? await projectStateHandle.get()
    if (input.allowWrite !== true) {
      if (!core.planSyncToXml) return toolError("core_error", "План XML-синхронизации недоступен")
      const planParams = {
        projectDir: component.projectDir,
        componentPath: component.componentPath,
        xmlDir: input.xmlDir,
        ...(input.ignoreValidationErrors === undefined ? {} : { ignoreValidationErrors: input.ignoreValidationErrors }),
      }
      const result = await core.planSyncToXml({ ...planParams, projectState })
      const diagnostics = "diagnostics" in result ? result.diagnostics : []
      return await withDiagnosticOutput({
        projectDir: component.projectDir,
        operation: "sync",
        operationId: `${Date.now()}-${Math.random()}`,
        diagnostics,
        map: mapDiagnostic,
        build: (output) => toolSuccess({ result: withoutDiagnostics(result), ...output }),
      })
    }

    const syncParams: Parameters<CoreApi["syncConfigurationToXML"]>[0] = {
      context: {
        languages: defaultMcpConfigurationLanguages,
        version: "2.20",
        exportToYAML: { toTyped: false },
        exportToXML: {
          itemsTree: [],
          version: "2.20",
          context: {
            forms: [],
            templates: [],
            parentName: "",
            metadataForNumbering: [],
          },
        },
      },
      projectDir: component.projectDir,
      componentPath: component.componentPath,
      xmlDir: input.xmlDir,
      ...(input.concurrency === undefined ? {} : { concurrency: input.concurrency }),
      ...(input.ignoreValidationErrors === undefined ? {} : { ignoreValidationErrors: input.ignoreValidationErrors }),
      projectState,
    }
    const result = await core.syncConfigurationToXML(syncParams)

    const diagnostics = result.diagnostics ?? concatenate(result.failed, result.warnings)
    return await withDiagnosticOutput({
      projectDir: component.projectDir,
      operation: "sync",
      operationId: `${Date.now()}-${Math.random()}`,
      diagnostics,
      map: mapDiagnostic,
      build: (output) => toolSuccess({
        succeeded: result.succeeded,
        ...(result.configurationIndexPath === undefined ? {} : { configurationIndexPath: result.configurationIndexPath }),
        ...output,
        warnings: output.diagnostics.filter(isWarning).map(mapWarning),
        failed: output.diagnostics.filter(isError).map(mapError),
      }),
    })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}

function mapDiagnostic(diagnostic: SyncOutputDiagnostic): SyncOutputDiagnostic {
  return {
    severity: diagnostic.severity,
    code: diagnostic.code,
    message: diagnostic.message,
    ...(diagnostic.sourceProjectPath === undefined ? {} : { sourceProjectPath: diagnostic.sourceProjectPath }),
    ...(diagnostic.sourcePath === undefined ? {} : { sourcePath: diagnostic.sourcePath }),
    ...(diagnostic.targetXmlPath === undefined ? {} : { targetXmlPath: diagnostic.targetXmlPath }),
    ...(diagnostic.line === undefined ? {} : { line: diagnostic.line }),
    ...(diagnostic.col === undefined ? {} : { col: diagnostic.col }),
  }
}

function isWarning(diagnostic: SyncOutputDiagnostic): boolean {
  return diagnostic.severity === "warning"
}

function isError(diagnostic: SyncOutputDiagnostic): boolean {
  return diagnostic.severity === "error"
}

function mapWarning(diagnostic: SyncOutputDiagnostic): { severity: "warning"; code: string; message: string } {
  return { severity: "warning", code: diagnostic.code, message: diagnostic.message }
}

function mapError(diagnostic: SyncOutputDiagnostic): { severity: "error"; code: string; message: string } {
  return { severity: "error", code: diagnostic.code, message: diagnostic.message }
}

function* concatenate<T>(...sources: readonly (readonly T[])[]): Iterable<T> {
  for (const source of sources) yield* source
}

function withoutDiagnostics<T extends object>(result: T): Omit<T, "diagnostics"> {
  const { diagnostics: _diagnostics, ...rest } = result as T & { diagnostics?: unknown }
  return rest
}
