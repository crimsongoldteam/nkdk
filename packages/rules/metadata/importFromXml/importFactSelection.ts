import {
  dependentImportDependencies,
  isDependentImportProperty,
  type CompiledPropertyRuleExecution,
  type DirectImportPropertyFact,
  type MetadataItemRule,
} from "@nkdk/runtime/rule-kit"
import { getTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import { isDataPathRule } from "../validation/dataPath/formYamlTraversal"
import { clientApplicationFormDataPathProjection } from "../forms/clientApplicationForm/formDataPathProjection"
import { importValidationPropertyNames } from "./importValidationProperties"

/** Отбор входов второго прохода; сравнение BaseForm выбирает полный набор отдельно. */
export function createImportFactSelection(params: {
  readonly rule: MetadataItemRule
  readonly owner: { readonly dir: string; readonly name: string }
  readonly augmentedRoots: readonly string[]
  readonly execution?: CompiledPropertyRuleExecution
}) {
  const rootValues = new Set([
    clientApplicationFormDataPathProjection.attributesYaml, ...params.augmentedRoots,
    ...importValidationPropertyNames(),
  ])
  // Корневой singleton участвует в окончательном решении о пустом значении.
  for (const property of Object.values(params.rule.properties)) {
    const nested = params.execution === undefined
      ? getTypeRule(property.type, "yamlToXMLNestedRule")
      : params.execution.getTypeRule(property.type, "yamlToXMLNestedRule")
    if (nested?.kind === "item" && typeof property.yaml === "string") rootValues.add(property.yaml)
  }
  const retainedProperties = new WeakMap<MetadataItemRule, { keys: ReadonlySet<string>; dependent: boolean }>()
  const select = (fact: DirectImportPropertyFact, final: boolean): boolean => {
    if (fact.itemRule === undefined) return true
    const property = fact.itemRule.properties[fact.propertyKey]
    if (property === undefined) return true
    let retained = retainedProperties.get(fact.itemRule)
    if (retained === undefined) {
      const keys = new Set<string>(["mainAttribute", "valuesPicture", "multipleValuesExtendedEdit"])
      let hasDependencies = false
      for (const [key, rule] of Object.entries(fact.itemRule.properties)) {
        const finalizer = params.execution === undefined
          ? getTypeRule(rule.type, "finalizeImportedYAML")
          : params.execution.getTypeRule(rule.type, "finalizeImportedYAML")
        const dependent = params.execution === undefined
          ? isDependentImportProperty(fact.itemType, key)
          : params.execution.isDependentImportProperty(fact.itemType, key)
        hasDependencies ||= dependent
        if (rule.xmlOnly === true || rule.fromXML === false || rule.preserveEmptyXML === true
          || rule.ownerFactRole !== undefined || isDataPathRule(rule) || finalizer !== undefined || dependent) keys.add(key)
        const target = rule.metadataTarget
        if (target?.kind === "member" && target.owner === "type" && target.typeProperty !== undefined) keys.add(target.typeProperty)
      }
      retained = { keys, dependent: hasDependencies }
      retainedProperties.set(fact.itemRule, retained)
    }
    const path = fact.yamlPath.slice(0, -1)
    const name = path.at(-1)
    const context = {
      itemType: fact.itemType, itemYamlPath: path,
      ...(typeof name === "string" ? { itemName: name } : {}),
      rootRule: params.rule, owner: params.owner,
    }
    const dependencies = !retained.dependent ? undefined : params.execution === undefined
      ? dependentImportDependencies(context) : params.execution.dependentImportDependencies(context)
    for (const key of dependencies?.root ?? []) rootValues.add(key)
    // Имена стандартных реквизитов становятся известны при обходе детей.
    // Корневые кандидаты живут только до конца этого файла, не между проходами.
    if (!final && fact.yamlPath.length === 1) return true
    if (fact.propertyKey.startsWith("$") || rootValues.has(String(fact.yamlPath[0]))) return true
    if (fact.reconstructionValue !== undefined || fact.scalarTag !== undefined || retained.keys.has(fact.propertyKey)) return true
    return typeof property.yaml === "string" && dependencies?.item.includes(property.yaml) === true
  }
  return {
    get rootProperties(): ReadonlySet<string> { return rootValues },
    accept: (fact: DirectImportPropertyFact) => select(fact, false),
    finish: (facts: readonly DirectImportPropertyFact[]) => facts.filter(fact => select(fact, true)),
  }
}
