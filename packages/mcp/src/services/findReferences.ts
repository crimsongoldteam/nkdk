import { loadCoreApi, type CoreApi } from "../coreApi"
import { errorMessage, toolError, type ToolPayload } from "../contracts/common"
import type { FindReferencesInput } from "../contracts/operations"

type FindReferencesDeps = Pick<CoreApi, "findMetadataReferences">

export async function findReferences(input: FindReferencesInput, deps?: FindReferencesDeps): Promise<ToolPayload> {
  try {
    const core = deps ?? (await loadCoreApi())
    return (await core.findMetadataReferences(input)) as unknown as ToolPayload
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
