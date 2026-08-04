import { type CoreApi, type CoreProjectStateService } from "../coreApi"
import { errorMessage, toolError, type ToolPayload } from "../contracts/common"
import type { FindReferencesInput } from "../contracts/operations"
import { prepareMetadataOperation } from "./metadataOperationContext"
import { prepareMetadataOperationOutput } from "./metadataOperationOutput"

type FindReferencesDeps = Pick<CoreApi, "findMetadataReferences"> & { readonly projectState?: CoreProjectStateService }

export async function findReferences(input: FindReferencesInput, deps?: FindReferencesDeps): Promise<ToolPayload> {
  try {
    const operation = await prepareMetadataOperation(input, deps)
    if (!operation.ok) return operation.error
    const result = await operation.core.findMetadataReferences({
      projectDir: operation.component.projectDir,
      componentPath: operation.component.componentPath,
      path: input.metadataRef,
      ignoreValidationErrors: input.ignoreValidationErrors,
      projectState: operation.projectState,
    })
    return await prepareMetadataOperationOutput({
      projectDir: operation.component.projectDir,
      operation: "find-references",
      result,
    })
  } catch (caught) {
    return toolError("core_error", errorMessage(caught))
  }
}
