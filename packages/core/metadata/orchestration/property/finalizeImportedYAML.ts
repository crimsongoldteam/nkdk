import type { ConfigurationContext } from "../../context/types"
import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"
import type { DeferredImportedYamlValue, DeferredRulePathSegment } from "./importYamlTypes"
import { getTypeRule } from "./typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "./types"

export function finalizeImportedYamlValues(params: {
  yaml: unknown
  rootRule: MetadataItemRule
  deferred: readonly DeferredImportedYamlValue[]
  context: ConfigurationContext
  formDataPathIndex?: FormDataPathIndex
}): void {
  for (const deferred of params.deferred) {
    const yamlPath = printableYamlPath(deferred.yamlPath)
    const rulePath = printableRulePath(deferred.rulePath)
    try {
      const rule = resolveDeferredPropertyRule(params.rootRule, deferred.rulePath)
      const finalize = getTypeRule(rule.type, "finalizeImportedYAML")
      if (finalize === undefined) throw new Error(`Для типа ${rule.type} не зарегистрирован finalizeImportedYAML`)
      const current = readYamlPath(params.yaml, deferred.yamlPath)
      const value = finalize({
        context: params.context,
        rule,
        value: current,
        ...(params.formDataPathIndex === undefined ? {} : { formDataPathIndex: params.formDataPathIndex }),
      })
      writeYamlPath(params.yaml, deferred.yamlPath, value)
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause)
      throw new Error(`Ошибка уточнения YAML: yamlPath=${yamlPath}, rulePath=${rulePath}: ${message}`, { cause })
    }
  }
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

function readYamlPath(root: unknown, path: readonly (string | number)[]): unknown {
  let current = root
  for (const segment of path) {
    const container = asContainer(current)
    if (container === undefined || !Object.prototype.hasOwnProperty.call(container, segment)) {
      throw new Error(`Не найден yamlPath ${printableYamlPath(path)}`)
    }
    current = container[segment]
  }
  return current
}

function writeYamlPath(root: unknown, path: readonly (string | number)[], value: unknown): void {
  if (path.length === 0) throw new Error("Нельзя заменить корень YAML без yamlPath")
  const owner = readYamlPath(root, path.slice(0, -1))
  const container = asContainer(owner)
  const key = path[path.length - 1]
  if (container === undefined || !Object.prototype.hasOwnProperty.call(container, key)) {
    throw new Error(`Не найден yamlPath ${printableYamlPath(path)}`)
  }
  container[key] = value
}

function asContainer(value: unknown): Record<string | number, unknown> | undefined {
  return value !== null && typeof value === "object" ? (value as Record<string | number, unknown>) : undefined
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
