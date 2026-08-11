import type { FormDataPathMetadataProjection } from "./formDataPathProjection"
import { currentValidationRegistrySet } from "./validationExecutionContext"

export function getRegisteredFormDataPathMetadataProjection(): FormDataPathMetadataProjection | undefined {
  return currentValidationRegistrySet<{
    form: { readonly dataPathProjection?: FormDataPathMetadataProjection }
  }>()?.form.dataPathProjection
}
