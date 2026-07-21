import { loadCoreApi } from "../coreApi"
import { errorMessage, toolError, toolSuccess, type ToolPayload } from "../contracts/common"
import type { InitSyncStateInput } from "../contracts/initSyncState"
import { resolveComponent } from "./componentResolver"

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
      projectDir: input.projectDir,
      componentPath: input.componentPath ?? "cf",
      xmlDir: input.xmlDir,
    })
  }

  try {
    const component = resolveComponent({
      projectDir: input.projectDir,
      componentPath: input.componentPath,
    })
    if (!component.ok) return component.error

    const core = deps ?? (await loadCoreApi())
    await core.initializeXmlSyncState({
      yamlDir: component.componentDir,
      xmlDir: input.xmlDir,
    })
    return toolSuccess({ stateFile: ".nkdk-sync.yaml" as const })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
