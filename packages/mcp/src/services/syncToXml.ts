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
  changedXmlFiles?: Array<{ path: string; change: "added" | "changed" | "deleted" }>
  migrationsApplied?: Array<{ fileName: string; from: string; to: string }>
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
  planSyncToXml?: (params: { inputDir: string; outputDir: string; referenceDir?: string }) => Promise<{
    ok: boolean
    mode?: "plan"
    migrationsToApply?: Array<{ fileName: string; from: string; to: string }>
  }>
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
  result?: unknown
  succeeded?: number
  changedXmlFiles?: Array<{ path: string; change: "added" | "changed" | "deleted" }>
  migrationsApplied?: Array<{ fileName: string; from: string; to: string }>
  failed?: Array<{ kind: string; name: string; parent?: string; message: string }>
}>

export async function syncToXml(input: SyncToXmlInput, deps?: SyncToXmlDeps): Promise<SyncToXmlPayload> {
  try {
    const core = deps ?? (await loadCoreApi())
    const referenceDir = input.referenceDir ?? input.xmlDir
    if (input.allowWrite !== true) {
      if (!core.planSyncToXml) return toolError("core_error", "План XML-синхронизации недоступен")
      const result = await core.planSyncToXml({
        inputDir: input.yamlDir,
        outputDir: input.xmlDir,
        referenceDir,
      })
      return toolSuccess({ result })
    }

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
      ...(result.changedXmlFiles !== undefined ? { changedXmlFiles: result.changedXmlFiles } : {}),
      ...(result.migrationsApplied !== undefined ? { migrationsApplied: result.migrationsApplied } : {}),
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
