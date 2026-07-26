import {
  listInfobases as listPlatformInfobases,
  type InfobaseTreeResult,
} from "@nkdk/platform"
import {
  errorMessage,
  toolError,
  toolSuccess,
  type ToolFailure,
  type ToolSuccess,
} from "../contracts/common"

export type ListInfobasesSuccess = InfobaseTreeResult & Record<string, unknown>
export type ListInfobasesPayload = ToolSuccess<ListInfobasesSuccess>

export async function listInfobasesService(
  deps: { listInfobases: () => Promise<InfobaseTreeResult> } = {
    listInfobases: listPlatformInfobases,
  },
): Promise<ListInfobasesPayload | ToolFailure> {
  try {
    return toolSuccess(await deps.listInfobases())
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
