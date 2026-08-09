import type { FormDataPathMetadataProjection } from "./formDataPathProjection"

let formDataPathMetadataProjection: FormDataPathMetadataProjection | undefined

export function registerFormDataPathMetadataProjection(projection: FormDataPathMetadataProjection): void {
  formDataPathMetadataProjection = projection
}

export function getRegisteredFormDataPathMetadataProjection(): FormDataPathMetadataProjection | undefined {
  return formDataPathMetadataProjection
}
