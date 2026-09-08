import { createFormDataPathIndexFromYAML as createProjectedFormDataPathIndexFromYAML } from "../../validation/dataPath/formYamlIndex"
import { clientApplicationFormDataPathProjection } from "./formDataPathProjection"
import { ClientApplicationFormRules } from "./rules"
import type { MetadataItemRule } from "../../ruleRuntime"

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

export function importedClientApplicationForm(params: {
  yaml: unknown
  rule: MetadataItemRule
}): { yaml: unknown; rule: typeof ClientApplicationFormRules } | undefined {
  const path = clientApplicationFormYamlPath(params.rule)
  if (path === undefined) return undefined
  if (path.length === 0) {
    return { yaml: params.yaml, rule: ClientApplicationFormRules }
  }
  if (params.yaml === null || typeof params.yaml !== "object" || Array.isArray(params.yaml)) return undefined
  return { yaml: Reflect.get(params.yaml, path[0]!), rule: ClientApplicationFormRules }
}

export function clientApplicationFormYamlPath(rule: MetadataItemRule): readonly string[] | undefined {
  if (rule.itemType === ClientApplicationFormRules.itemType) return []
  const property = Object.values(rule.properties).find(property => property.type === "ClientApplicationForm" && property.yaml !== undefined)
  return property?.yaml === undefined ? undefined : [property.yaml]
}

export function createImportedFormDataPathIndex(params: {
  yaml: unknown
  rule: MetadataItemRule
}) {
  const form = importedClientApplicationForm(params)
  return form === undefined ? undefined : createFormDataPathIndexFromYAML(form.yaml)
}
