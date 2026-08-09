import { createFormDataPathIndexFromYAML as createProjectedFormDataPathIndexFromYAML } from "../../validation/dataPath/formYamlIndex"
import { clientApplicationFormDataPathProjection } from "./formDataPathProjection"

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
