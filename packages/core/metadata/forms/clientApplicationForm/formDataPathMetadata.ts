import { createFormDataPathIndexFromYAML as createProjectedFormDataPathIndexFromYAML } from "../../validation/dataPath/formYamlIndex"
import { clientApplicationFormDataPathProjection } from "./formDataPathProjection"

export function createFormDataPathIndexFromYAML(
  yaml: unknown,
  tabularElementsByName?: ReadonlyMap<string, {
    readonly kind: "tabularFormElement"
    readonly dataPath?: string
  }>
) {
  // Корни всегда строятся только из Реквизиты этого YAML. Дополнительный аргумент
  // описывает лишь табличные элементы того же представления формы.
  return createProjectedFormDataPathIndexFromYAML(
    yaml,
    clientApplicationFormDataPathProjection,
    tabularElementsByName
  )
}
