import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type ImportFromXmlInput } from "../contracts/importFromXml"

interface CoreImportDiagnostic {
  severity: "error" | "warning"
  code: string
  message: string
  targetProjectPath: string
  sourcePath?: string
  value?: string
}

interface CoreImportResult {
  succeeded: number
  failed: CoreImportDiagnostic[]
  warnings: CoreImportDiagnostic[]
  configurationIndexPath?: string
  preservedTempRoot?: string
}

interface ImportFromXmlDeps {
  syncConfigurationFromXML: (params: {
    context: {
      defaultLanguage: "ru"
      version: "2.20"
      exportToYAML: { toTyped: false }
      fromXML: { forReference: false }
    }
    inputDir: string
    outputDir: string
  }) => Promise<CoreImportResult>
}

export type ImportFromXmlPayload = ToolPayload<{
  succeeded: number
  failed: Array<{ kind: string; name: string; parent?: string; message: string }>
  warnings: Array<{ code: string; message: string; targetProjectPath?: string }>
  configurationIndexPath?: string
  preservedTempRoot?: string
}>

export async function importFromXml(
  input: ImportFromXmlInput,
  deps?: ImportFromXmlDeps,
): Promise<ImportFromXmlPayload> {
  if (input.allowWrite !== true) {
    return toolError("confirmation_required", "import_from_xml пишет YAML-файлы; повторите вызов с allowWrite=true", {
      xmlDir: input.xmlDir,
      yamlDir: input.yamlDir,
    })
  }

  try {
    const core = deps ?? (await loadCoreApi())
    const result = await core.syncConfigurationFromXML({
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        fromXML: { forReference: false },
      },
      inputDir: input.xmlDir,
      outputDir: input.yamlDir,
    })

    return toolSuccess({
      succeeded: result.succeeded,
      failed: result.failed.map(mapFailure),
      warnings: result.warnings.map(mapWarning),
      ...(result.configurationIndexPath === undefined
        ? {}
        : { configurationIndexPath: result.configurationIndexPath }),
      ...(result.preservedTempRoot === undefined ? {} : { preservedTempRoot: result.preservedTempRoot }),
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
