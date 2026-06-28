import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import type { InitSyncStateInput } from "../contracts/initSyncState"

interface InitSyncStateDeps {
  initializeXmlSyncState: (params: {
    yamlDir: string
    xmlDir: string
  }) => Promise<void>
}

export type InitSyncStatePayload = ToolPayload<{ stateFile: ".nkdk-sync.yaml" }>

export async function initSyncState(input: InitSyncStateInput, deps?: InitSyncStateDeps): Promise<InitSyncStatePayload> {
  if (input.allowWrite !== true) {
    return toolError("confirmation_required", "init_sync_state пишет .nkdk-sync.yaml; повторите вызов с allowWrite=true", {
      yamlDir: input.yamlDir,
      xmlDir: input.xmlDir,
    })
  }

  try {
    const core = deps ?? (await loadCoreApi())
    await core.initializeXmlSyncState({
      yamlDir: input.yamlDir,
      xmlDir: input.xmlDir,
    })
    return toolSuccess({ stateFile: ".nkdk-sync.yaml" as const })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
