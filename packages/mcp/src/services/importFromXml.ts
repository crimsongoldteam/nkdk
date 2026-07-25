import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type ImportFromXmlInput } from "../contracts/importFromXml"
import { resolveComponent } from "./componentResolver"

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
  importConfigurationFromXml: (params: {
    context: {
      defaultLanguage: "ru"
      version: "2.20"
      exportToYAML: { toTyped: false }
      fromXML: { forReference: false }
    }
    inputDir: string
    projectDir: string
    requestedComponentPath?: string
  }) => Promise<CoreImportResult>
}

export type ImportFromXmlPayload = ToolPayload<{
  componentPath: string
  succeeded: number
  failed: Array<{ kind: string; name: string; parent?: string; message: string }>
  warnings: Array<{ code: string; message: string; targetProjectPath?: string }>
  configurationIndexPath?: string
}>

export async function importFromXml(
  input: ImportFromXmlInput,
  deps?: ImportFromXmlDeps,
): Promise<ImportFromXmlPayload> {
  if (input.allowWrite !== true) {
    return toolError("confirmation_required", "import_from_xml пишет YAML-файлы; повторите вызов с allowWrite=true", {
      xmlDir: input.xmlDir,
      projectDir: input.projectDir,
      componentPath: input.componentPath ?? "cf",
    })
  }

  try {
    const project = resolveComponent({ projectDir: input.projectDir })
    if (!project.ok) return project.error

    const core = deps ?? (await loadCoreApi())
    const result = await core.importConfigurationFromXml({
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        fromXML: { forReference: false },
      },
      inputDir: input.xmlDir,
      projectDir: project.projectDir,
      ...(input.componentPath === undefined ? {} : { requestedComponentPath: input.componentPath }),
    })

    const failed = result.failed.map(mapFailure)
    const warnings = result.warnings.map(mapWarning)
    if (result.componentPath === undefined) {
      return toolError(
        "core_error",
        result.failed.find((failure) => failure.severity === "error")?.message ?? "Не удалось определить компонент XML-выгрузки",
        {
          succeeded: result.succeeded,
          failed,
          warnings,
          ...(result.configurationIndexPath === undefined
            ? {}
            : { configurationIndexPath: result.configurationIndexPath }),
        },
      )
    }

    return toolSuccess({
      componentPath: result.componentPath,
      succeeded: result.succeeded,
      failed,
      warnings,
      ...(result.configurationIndexPath === undefined
        ? {}
        : { configurationIndexPath: result.configurationIndexPath }),
    })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}

function mapFailure(failure: CoreImportDiagnostic): { kind: string; name: string; message: string } {
  return {
    kind: failure.code,
    name: failure.targetProjectPath,
    message: failure.message,
  }
}

function mapWarning(warning: CoreImportDiagnostic): {
  code: string
  message: string
  targetProjectPath?: string
} {
  return {
    code: warning.code,
    message: warning.message,
    ...(warning.targetProjectPath.length === 0 ? {} : { targetProjectPath: warning.targetProjectPath }),
  }
}
