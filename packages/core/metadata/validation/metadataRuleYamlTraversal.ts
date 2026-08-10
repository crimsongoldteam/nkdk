import { getTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import type { MetadataItemRule, PropertyRule } from "../ruleRuntime/property/types"
import type { YamlPath } from "./yamlLocations"

export interface MetadataRuleYamlObject<State> {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly yamlPath: YamlPath
  readonly state: State
}

export interface MetadataRuleYamlCollectionItem<State> extends MetadataRuleYamlObject<State> {
  readonly itemName: string | undefined
}

interface MetadataRuleYamlCallbacks<State> {
  readonly onObject?: (object: MetadataRuleYamlObject<State>) => void
  readonly enterNestedObject?: (object: MetadataRuleYamlObject<State>) => State
  readonly enterCollectionItem?: (item: MetadataRuleYamlCollectionItem<State>) => State
}

interface MetadataRuleYamlContext<State> extends MetadataRuleYamlObject<State>, MetadataRuleYamlCallbacks<State> {}

export function traverseMetadataRuleYaml<State>(params: {
  readonly yaml: unknown
  readonly rule: MetadataItemRule
  readonly initialState: State
} & MetadataRuleYamlCallbacks<State>): void {
  visitObject({ ...params, yamlPath: [], state: params.initialState })
}

function visitObject<State>(params: MetadataRuleYamlContext<State>): void {
  const record = asRecord(params.yaml)
  if (record === undefined) return
  params.onObject?.(params)

  for (const propertyRule of Object.values(params.rule.properties)) {
    if (typeof propertyRule.yaml !== "string" || !Object.hasOwn(record, propertyRule.yaml)) continue
    visitNested({
      ...params,
      propertyRule,
      yaml: record[propertyRule.yaml],
      yamlPath: [...params.yamlPath, propertyRule.yaml],
    })
  }
}

function visitNested<State>(params: MetadataRuleYamlContext<State> & {
  readonly propertyRule: PropertyRule
}): void {
  const nested = getTypeRule(params.propertyRule.type, "yamlToXMLNestedRule")
  if (nested === undefined || nested.kind === "externalFile") return
  if (nested.kind === "item") {
    const object = {
      ...params,
      rule: nested.itemRuleFromProperty?.(params.propertyRule) ?? nested.itemRule,
    }
    visitObject({ ...object, state: params.enterNestedObject?.(object) ?? params.state })
    return
  }
  if (nested.kind === "polymorphicRecord") {
    const record = asRecord(params.yaml)
    if (record !== undefined) {
      const object = { ...params, rule: nested.resolveItemRule({ yaml: record, name: "" }) }
      visitObject({ ...object, state: params.enterNestedObject?.(object) ?? params.state })
    }
    return
  }

  const fallbackRule = nested.itemRuleFromProperty?.(params.propertyRule) ?? nested.itemRule
  if (Array.isArray(params.yaml)) {
    params.yaml.forEach((item, index) => {
      const rule = nested.resolveItemRule?.({
        yaml: item,
        name: undefined,
        index,
        propertyRule: params.propertyRule,
      }) ?? fallbackRule
      const object = {
        ...params,
        yaml: item,
        rule,
        yamlPath: [...params.yamlPath, index],
        itemName: itemNameFromArrayItem(item),
      }
      visitObject({ ...object, state: params.enterCollectionItem?.(object) ?? params.state })
    })
    return
  }

  const record = asRecord(params.yaml)
  if (record === undefined) return
  let index = 0
  for (const [yamlKey, item] of Object.entries(record)) {
    const itemName = nested.nameFromYAMLKeyForProperty?.({ yamlKey, propertyRule: params.propertyRule })
      ?? nested.nameFromYAMLKey?.(yamlKey)
      ?? yamlKey
    const rule = nested.resolveItemRule?.({
      yaml: item,
      name: itemName,
      index,
      propertyRule: params.propertyRule,
    }) ?? fallbackRule
    const object = {
      ...params,
      yaml: item,
      rule,
      yamlPath: [...params.yamlPath, yamlKey],
      itemName,
    }
    visitObject({ ...object, state: params.enterCollectionItem?.(object) ?? params.state })
    index += 1
  }
}

function itemNameFromArrayItem(value: unknown): string | undefined {
  const record = asRecord(value)
  const name = record?.["name"] ?? record?.["Имя"]
  return typeof name === "string" && name.length > 0 ? name : undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined
}
