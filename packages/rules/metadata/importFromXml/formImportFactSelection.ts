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

/** Входы второго прохода обычной формы; сравнение BaseForm выбирает полный набор отдельно. */
export function createFormImportFactSelection(params: {
  readonly rule: MetadataItemRule
  readonly owner: { readonly dir: string; readonly name: string }
  readonly augmentedRoots: readonly string[]
  readonly execution?: CompiledPropertyRuleExecution
}): (fact: DirectImportPropertyFact) => boolean {
  const rootValues = new Set([clientApplicationFormDataPathProjection.attributesYaml, ...params.augmentedRoots])
  // Корневой singleton участвует в окончательном решении о пустом значении.
  for (const property of Object.values(params.rule.properties)) {
    const nested = params.execution === undefined
      ? getTypeRule(property.type, "yamlToXMLNestedRule")
      : params.execution.getTypeRule(property.type, "yamlToXMLNestedRule")
    if (nested?.kind === "item" && typeof property.yaml === "string") rootValues.add(property.yaml)
  }
  const retainedProperties = new WeakMap<MetadataItemRule, { keys: ReadonlySet<string>; dependent: boolean }>()
  return fact => {
    if (fact.itemRule === undefined || fact.itemType === params.rule.itemType
      || fact.propertyKey.startsWith("$") || rootValues.has(String(fact.yamlPath[0]))) return true
    if (fact.reconstructionValue !== undefined || fact.scalarTag !== undefined) return true
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
    if (retained.keys.has(fact.propertyKey)) return true
    if (!retained.dependent) return false
    const path = fact.yamlPath.slice(0, -1)
    const name = path.at(-1)
    const context = {
      itemType: fact.itemType, itemYamlPath: path,
      ...(typeof name === "string" ? { itemName: name } : {}),
      rootRule: params.rule, owner: params.owner,
    }
    const dependencies = params.execution === undefined
      ? dependentImportDependencies(context)
      : params.execution.dependentImportDependencies(context)
    return typeof property.yaml === "string" && dependencies?.item.includes(property.yaml) === true
  }
}
