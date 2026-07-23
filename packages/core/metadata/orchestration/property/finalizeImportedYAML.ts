import type { ConfigurationContext } from "../../context/types"
import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"
import { finalizeDeferredObjectValues, type DeferredObjectValue } from "./deferredObjectValues"
import type { DeferredRulePathSegment } from "./importYamlTypes"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"

export function finalizeImportedYamlValues(params: {
  yaml: unknown
  rootRule: MetadataItemRule
  deferred: readonly DeferredObjectValue[]
  context: ConfigurationContext
  formDataPathIndex?: FormDataPathIndex
}): void {
  finalizeDeferredObjectValues({
    root: params.yaml,
    deferred: params.deferred,
    finalize: ({ deferred, value }) => {
      const valuePath = printableYamlPath(deferred.valuePath)
      const rulePath = printableRulePath(deferred.rulePath)
      try {
      const rule = resolveDeferredPropertyRule(params.rootRule, deferred.rulePath)
      const finalize = getTypeRule(rule.type, "finalizeImportedYAML")
      if (finalize === undefined) throw new Error(`Для типа ${rule.type} не зарегистрирован finalizeImportedYAML`)
      return finalize({
        context: params.context,
        rule,
        value,
        ...(params.formDataPathIndex === undefined ? {} : { formDataPathIndex: params.formDataPathIndex }),
      })
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause)
        throw new Error(`Ошибка уточнения YAML: valuePath=${valuePath}, rulePath=${rulePath}: ${message}`, { cause })
      }
    },
  })
}

export function resolveDeferredPropertyRule(
  rootRule: MetadataItemRule,
  rulePath: readonly DeferredRulePathSegment[]
): PropertyRule {
  if (rulePath.length === 0) throw new Error("Пустой rulePath отложенного YAML")
  const printablePath = printableRulePath(rulePath)
  let itemRule = rootRule

  for (const [index, segment] of rulePath.entries()) {
    const propertyRule = itemRule.properties[segment.propertyKey]
    if (propertyRule === undefined) throw new Error(`Не найден rulePath ${printablePath}`)
    if (index === rulePath.length - 1) return propertyRule

    const nested = getTypeRule(propertyRule.type, "nestedItemRule")
    if (nested === undefined) {
      throw new Error(`rulePath ${printablePath} проходит через атомарное свойство ${segment.propertyKey}`)
    }
    itemRule =
      "itemRule" in nested
        ? nested.itemRule
        : nested.resolveItemRule(requireNestedItemType(segment, printablePath))
  }

  throw new Error(`Не найден rulePath ${printablePath}`)
}

function requireNestedItemType(segment: DeferredRulePathSegment, printablePath: string): string {
  if (segment.nestedItemType === undefined) {
    throw new Error(`В rulePath ${printablePath} отсутствует nestedItemType`)
  }
  return segment.nestedItemType
}

function printableYamlPath(path: readonly (string | number)[]): string {
  return `/${path.map(String).join("/")}`
}

function printableRulePath(path: readonly DeferredRulePathSegment[]): string {
  return `/${path
    .map(({ propertyKey, nestedItemType }) =>
      nestedItemType === undefined ? propertyKey : `${propertyKey}:${nestedItemType}`
    )
    .join("/")}`
}
