import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type ImportFromXmlInput } from "../contracts/importFromXml"

interface CoreFailure {
  kind: string
  name: string
  parent?: string
  error: unknown
}

interface CoreSyncResult {
  succeeded: number
  failed: CoreFailure[]
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
  }) => Promise<CoreSyncResult>
}

export type ImportFromXmlPayload = ToolPayload<{
  succeeded: number
  failed: Array<{ kind: string; name: string; parent?: string; message: string }>
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
    })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}

function mapFailure(failure: CoreFailure): { kind: string; name: string; parent?: string; message: string } {
  return {
    kind: failure.kind,
    name: failure.name,
    ...(failure.parent !== undefined ? { parent: failure.parent } : {}),
    message: errorMessage(failure.error),
  }
}
