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
  tableDataPathByElementName?: ReadonlyMap<string, string>
) {
  return createProjectedFormDataPathIndexFromYAML(
    yaml,
    clientApplicationFormDataPathProjection,
    tableDataPathByElementName
  )
}
