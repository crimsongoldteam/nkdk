import {
  createFormDataPathIndexFromYAML as createProjectedFormDataPathIndexFromYAML,
  createFormDataPathMetadataCollector as createProjectedFormDataPathMetadataCollector,
} from "../../validation/dataPath/formYamlIndex"
import { clientApplicationFormDataPathProjection } from "./formDataPathProjection"

export function createFormDataPathMetadataCollector(params: { filePath: string }) {
  return createProjectedFormDataPathMetadataCollector({
    ...params,
    projection: clientApplicationFormDataPathProjection,
  })
}

export function createFormDataPathIndexFromYAML(
  yaml: unknown,
  tabularElementsByName?: ReadonlyMap<string, {
    readonly kind: "tabularFormElement"
    readonly dataPath?: string
  }>
) {
  return createProjectedFormDataPathIndexFromYAML(
    yaml,
    clientApplicationFormDataPathProjection,
    tabularElementsByName
  )
}
