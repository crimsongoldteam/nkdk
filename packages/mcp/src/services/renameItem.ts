import { loadCoreApi, type CoreApi } from "../coreApi"
import { errorMessage, toolError, type ToolPayload } from "../contracts/common"
import type { RenameItemInput } from "../contracts/operations"
import { resolveComponent } from "./componentResolver"

type RenameItemDeps = Pick<CoreApi, "renameMetadataItem">

export async function renameItem(
  input: RenameItemInput,
  deps?: RenameItemDeps,
): Promise<ToolPayload> {
  try {
    const component = resolveComponent({ projectDir: input.projectDir, componentPath: input.componentPath })
    if (!component.ok) return component.error

    const core = deps ?? (await loadCoreApi())
    return (await core.renameMetadataItem({
      projectDir: component.componentDir,
      path: input.metadataRef,
      newName: input.newName,
      allowWrite: input.allowWrite,
    })) as unknown as ToolPayload
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
