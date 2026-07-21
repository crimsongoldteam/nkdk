import { loadCoreApi, type CoreApi } from "../coreApi"
import { errorMessage, toolError, type ToolPayload } from "../contracts/common"
import type { FindReferencesInput } from "../contracts/operations"
import { resolveComponent } from "./componentResolver"

type FindReferencesDeps = Pick<CoreApi, "findMetadataReferences">

export async function findReferences(input: FindReferencesInput, deps?: FindReferencesDeps): Promise<ToolPayload> {
  try {
    const component = resolveComponent({ projectDir: input.projectDir, componentPath: input.componentPath })
    if (!component.ok) return component.error

    const core = deps ?? (await loadCoreApi())
    return (await core.findMetadataReferences({
      projectDir: component.componentDir,
      path: input.metadataRef,
    })) as unknown as ToolPayload
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
