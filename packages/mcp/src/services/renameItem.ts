import { type CoreApi, type CoreProjectStateService } from "../coreApi"
import { errorMessage, toolError, type ToolPayload } from "../contracts/common"
import type { RenameItemInput } from "../contracts/operations"
import { prepareMetadataOperation } from "./metadataOperationContext"
import { prepareMetadataOperationOutput } from "./metadataOperationOutput"

type RenameItemDeps = Pick<CoreApi, "renameMetadataItem"> & { readonly projectState?: CoreProjectStateService }

export async function renameItem(
  input: RenameItemInput,
  deps?: RenameItemDeps,
): Promise<ToolPayload> {
  try {
    const operation = await prepareMetadataOperation(input, deps)
    if (!operation.ok) return operation.error
    const result = await operation.core.renameMetadataItem({
      projectDir: operation.component.projectDir,
      componentPath: operation.component.componentPath,
      path: input.metadataRef,
      newName: input.newName,
      allowWrite: input.allowWrite,
      ignoreValidationErrors: input.ignoreValidationErrors,
      projectState: operation.projectState,
    })
    return await prepareMetadataOperationOutput({
      projectDir: operation.component.projectDir,
      operation: "rename",
      result,
    })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
