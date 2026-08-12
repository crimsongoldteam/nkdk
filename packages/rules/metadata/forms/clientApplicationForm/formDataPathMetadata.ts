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
  if (params.rule.itemType === ClientApplicationFormRules.itemType) {
    return { yaml: params.yaml, rule: ClientApplicationFormRules }
  }
  if (params.yaml === null || typeof params.yaml !== "object" || Array.isArray(params.yaml)) return undefined

  for (const property of Object.values(params.rule.properties)) {
    if (property.type !== "ClientApplicationForm" || property.yaml === undefined) continue
    return {
      yaml: (params.yaml as Record<string, unknown>)[property.yaml],
      rule: ClientApplicationFormRules,
    }
  }
  return undefined
}

export function createImportedFormDataPathIndex(params: {
  yaml: unknown
  rule: MetadataItemRule
}) {
  const form = importedClientApplicationForm(params)
  return form === undefined ? undefined : createFormDataPathIndexFromYAML(form.yaml)
}
