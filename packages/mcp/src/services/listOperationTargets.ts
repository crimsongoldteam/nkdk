import { loadCoreApi, type CoreApi } from "../coreApi"
import { errorMessage, toolError, type ToolPayload } from "../contracts/common"
import type { ListOperationTargetsInput } from "../contracts/operations"

type ListOperationTargetsDeps = Pick<CoreApi, "listMetadataOperationTargets">

export async function listOperationTargets(
  input: ListOperationTargetsInput,
  deps?: ListOperationTargetsDeps,
): Promise<ToolPayload> {
  try {
    const core = deps ?? (await loadCoreApi())
    return core.listMetadataOperationTargets(input) as unknown as ToolPayload
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
