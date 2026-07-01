import { loadCoreApi, type CoreApi } from "../coreApi"
import { errorMessage, toolError, type ToolPayload } from "../contracts/common"
import type { RenameItemInput } from "../contracts/operations"

type RenameItemDeps = Pick<CoreApi, "renameMetadataItem">

export async function renameItem(
  input: RenameItemInput,
  deps?: RenameItemDeps,
): Promise<ToolPayload> {
  try {
    const core = deps ?? (await loadCoreApi())
    return core.renameMetadataItem(input) as unknown as ToolPayload
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
