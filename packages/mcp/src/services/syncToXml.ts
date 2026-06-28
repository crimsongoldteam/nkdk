import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import { type SyncToXmlInput } from "../contracts/syncToXml"

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

type ConfigDumpInfo = Map<
  string,
  {
    children: Map<string, string>
    id: string
    configVersion: string
  }
>

interface SyncToXmlDeps {
  readXmlSyncState?: (xmlDir: string) => Promise<unknown | undefined>
  syncConfigurationToXML: (params: {
    context: {
      defaultLanguage: "ru"
      version: "2.20"
      exportToYAML: { toTyped: false }
      exportToXML: {
        itemsTree: []
        configDumpInfo: ConfigDumpInfo
        version: "2.20"
        context: {
          forms: []
          templates: []
          parentName: ""
          metadataForNumbering: []
        }
      }
    }
    inputDir: string
    outputDir: string
    referenceDir?: string
  }) => Promise<CoreSyncResult>
  syncConfigurationIncrementallyToXML?: (params: {
    context: {
      defaultLanguage: "ru"
      version: "2.20"
      exportToYAML: { toTyped: false }
      exportToXML: {
        itemsTree: []
        configDumpInfo: ConfigDumpInfo
        version: "2.20"
        context: {
          forms: []
          templates: []
          parentName: ""
          metadataForNumbering: []
        }
      }
    }
    inputDir: string
    outputDir: string
    referenceDir?: string
  }) => Promise<CoreSyncResult>
}

export type SyncToXmlPayload = ToolPayload<{
  succeeded: number
  failed: Array<{ kind: string; name: string; parent?: string; message: string }>
}>

export async function syncToXml(input: SyncToXmlInput, deps?: SyncToXmlDeps): Promise<SyncToXmlPayload> {
  if (input.allowWrite !== true) {
    return toolError("confirmation_required", "sync_to_xml пишет XML-файлы; повторите вызов с allowWrite=true", {
      yamlDir: input.yamlDir,
      xmlDir: input.xmlDir,
      referenceDir: input.referenceDir,
    })
  }

  try {
    const core = deps ?? (await loadCoreApi())
    const referenceDir = input.referenceDir ?? input.xmlDir
    if (input.fullSync !== true) {
      const state = await core.readXmlSyncState?.(input.xmlDir)
      if (!state) {
        return toolError(
          "sync_state_required",
          "Файл .nkdk-sync.yaml не найден; вызовите nkdk.init_sync_state перед инкрементальной синхронизацией или явно запросите fullSync=true",
          { yamlDir: input.yamlDir, xmlDir: input.xmlDir, tool: "nkdk.init_sync_state" },
        )
      }
    }

    const sync =
      input.fullSync === true ? core.syncConfigurationToXML : core.syncConfigurationIncrementallyToXML
    if (!sync) return toolError("core_error", "Инкрементальная XML-синхронизация недоступна")

    const result = await sync({
      context: {
        defaultLanguage: "ru",
        version: "2.20",
        exportToYAML: { toTyped: false },
        exportToXML: {
          itemsTree: [],
          configDumpInfo: new Map(),
          version: "2.20",
          context: {
            forms: [],
            templates: [],
            parentName: "",
            metadataForNumbering: [],
          },
        },
      },
      inputDir: input.yamlDir,
      outputDir: input.xmlDir,
      referenceDir,
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
