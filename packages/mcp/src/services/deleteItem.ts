import { loadCoreApi, type CoreApi } from "../coreApi"
import { errorMessage, toolError, type ToolPayload } from "../contracts/common"
import type { DeleteItemInput } from "../contracts/operations"

type DeleteItemDeps = Pick<CoreApi, "deleteMetadataItem">

export async function deleteItem(
  input: DeleteItemInput,
  deps?: DeleteItemDeps,
): Promise<ToolPayload> {
  try {
    const core = deps ?? (await loadCoreApi())
    return (await core.deleteMetadataItem(input)) as unknown as ToolPayload
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
