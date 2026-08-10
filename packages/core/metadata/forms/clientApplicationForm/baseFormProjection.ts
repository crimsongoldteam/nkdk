import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import { getTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { resolveFormElementRule } from "../elements/ruleRuntime/fromYAMLToXML"
import type { FormElementTreeNodeYAML, FormElementTreeYAML } from "../commonObjects/childItems/types"
import { getTreeNodeJSONSchemaPropertyAliases } from "../commonObjects/childItems/treeYAML"
import {
  intersectBaseFormValues,
  projectProperty,
  type BaseFormProjectionContext,
} from "./baseFormProjectionRegistry"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormYAML } from "./types"

export interface ProjectedBaseForm {
  readonly yaml: ClientApplicationFormYAML
  readonly explicitComponents: {
    readonly attributes: ReadonlySet<string>
    readonly commands: ReadonlySet<string>
    readonly parameters: ReadonlySet<string>
  }
}

interface IndexedFormElement {
  readonly yaml: FormElementTreeNodeYAML
  readonly rule: MetadataItemRule
}

export function projectClientApplicationBaseForm(params: {
  readonly baseYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly rule?: MetadataItemRule
}): ProjectedBaseForm {
  const rule = params.rule ?? ClientApplicationFormRules
  const rootElementCollectionRule = rule.properties.childItems
  if (rootElementCollectionRule === undefined) {
    throw new Error(
      `Правило формы ${rule.itemType} не содержит коллекцию childItems`
    )
  }
  const extensionElementsByName = indexElementsByName(params.extensionYaml.Элементы, rootElementCollectionRule)
  const attributeNames = intersectNamedComponentNames(params.baseYaml.Реквизиты, params.extensionYaml.Реквизиты)
  const commandNames = intersectNamedComponentNames(params.baseYaml.Команды, params.extensionYaml.Команды)
  const parameterNames = intersectNamedComponentNames(params.baseYaml.Параметры, params.extensionYaml.Параметры)
  const projectionContext: BaseFormProjectionContext = {
    attributeNames,
    commandNames,
    parameterNames,
  }
  const properties = projectMetadataItemProperties({
    baseYaml: params.baseYaml,
    extensionYaml: params.extensionYaml,
    baseRule: rule,
    extensionRule: rule,
    context: projectionContext,
    skippedYamlKeys: new Set(["Элементы"]),
  })
  const elements =
    params.baseYaml.Элементы === undefined
      ? undefined
      : projectElementTree({
          baseElements: params.baseYaml.Элементы,
          baseCollectionRule: rootElementCollectionRule,
          extensionElementsByName,
          context: projectionContext,
        })
  const yaml = {
    ...properties,
    ...(elements === undefined ? {} : { Элементы: elements }),
  } as ClientApplicationFormYAML

  return {
    yaml,
    explicitComponents: {
      attributes: attributeNames,
      commands: commandNames,
      parameters: parameterNames,
    },
  }
}

function indexElementsByName(
  elements: FormElementTreeYAML | undefined,
  collectionRule: PropertyRule
): ReadonlyMap<string, IndexedFormElement> {
  const result = new Map<string, IndexedFormElement>()

  visitElementTree(elements, collectionRule, (name, element, rule) => {
    if (result.has(name)) {
      throw new Error(`External form contains duplicate element name "${name}"`)
    }
    result.set(name, { yaml: element, rule })
  })

  return result
}

function visitElementTree(
  elements: FormElementTreeYAML | undefined,
  collectionRule: PropertyRule,
  visit: (name: string, element: FormElementTreeNodeYAML, rule: MetadataItemRule) => void
): void {
  if (elements === undefined) return

  for (const [name, element] of Object.entries(elements)) {
    const rule = resolveFormElementRule({
      yaml: element,
      name,
      propertyRule: collectionRule,
    })
    visit(name, element, rule)

    if (element.Элементы === undefined) continue
    const childCollectionRule = propertyRuleByYamlKey(rule, "Элементы")
    if (childCollectionRule === undefined) {
      throw new Error(`Element "${name}" does not define the YAML property "Элементы"`)
    }
    visitElementTree(element.Элементы, childCollectionRule, visit)
  }
}

function projectElementTree(params: {
  readonly baseElements: FormElementTreeYAML
  readonly baseCollectionRule: PropertyRule
  readonly extensionElementsByName: ReadonlyMap<string, IndexedFormElement>
  readonly context: BaseFormProjectionContext
}): FormElementTreeYAML {
  return Object.fromEntries(
    Object.entries(params.baseElements).map(([name, baseElement]) => [
      name,
      projectElementSelection({
        name,
        baseElement,
        baseCollectionRule: params.baseCollectionRule,
        extensionElement: params.extensionElementsByName.get(name),
        extensionElementsByName: params.extensionElementsByName,
        context: params.context,
      }),
    ])
  )
}

function projectElementSelection(params: {
  readonly name: string
  readonly baseElement: FormElementTreeNodeYAML
  readonly baseCollectionRule: PropertyRule
  readonly extensionElement: IndexedFormElement | undefined
  readonly extensionElementsByName: ReadonlyMap<string, IndexedFormElement>
  readonly context: BaseFormProjectionContext
}): FormElementTreeNodeYAML {
  const baseRule = resolveFormElementRule({
    yaml: params.baseElement,
    name: params.name,
    propertyRule: params.baseCollectionRule,
  })
  const properties =
    params.extensionElement === undefined
      ? {}
      : projectAliasedMetadataItemProperties({
          baseYaml: params.baseElement,
          extensionYaml: params.extensionElement.yaml,
          baseRule,
          extensionRule: params.extensionElement.rule,
          context: params.context,
          skippedYamlKeys: new Set(["Элементы"]),
        })
  const result: FormElementTreeNodeYAML = {
    Вид: params.baseElement.Вид,
    ...properties,
  }

  if (params.baseElement.Элементы !== undefined) {
    const childCollectionRule = propertyRuleByYamlKey(baseRule, "Элементы")
    if (childCollectionRule === undefined) {
      throw new Error(`Element "${params.name}" does not define the YAML property "Элементы"`)
    }
    result.Элементы = projectElementTree({
      baseElements: params.baseElement.Элементы,
      baseCollectionRule: childCollectionRule,
      extensionElementsByName: params.extensionElementsByName,
      context: params.context,
    })
  }

  return result
}

function projectAliasedMetadataItemProperties(params: {
  readonly baseYaml: Record<string, unknown>
  readonly extensionYaml: Record<string, unknown>
  readonly baseRule: MetadataItemRule
  readonly extensionRule: MetadataItemRule
  readonly context: BaseFormProjectionContext
  readonly skippedYamlKeys?: ReadonlySet<string>
}): Record<string, unknown> {
  const baseAliases = getTreeNodeJSONSchemaPropertyAliases(
    params.baseRule.itemType
  )
  const extensionAliases = getTreeNodeJSONSchemaPropertyAliases(
    params.extensionRule.itemType
  )
  const projected = projectMetadataItemProperties({
    ...params,
    baseYaml: normalizeProjectionAliases(params.baseYaml, baseAliases),
    extensionYaml: normalizeProjectionAliases(
      params.extensionYaml,
      extensionAliases
    ),
  })
  return restoreProjectionAliases(
    projected,
    params.baseYaml,
    baseAliases
  )
}

function normalizeProjectionAliases(
  yaml: Record<string, unknown>,
  aliases: Readonly<Record<string, string>>
): Record<string, unknown> {
  const result = { ...yaml }
  for (const [ruleYamlKey, treeYamlKey] of Object.entries(aliases)) {
    if (Object.hasOwn(yaml, treeYamlKey)) {
      result[ruleYamlKey] = yaml[treeYamlKey]
    } else {
      delete result[ruleYamlKey]
    }
  }
  return result
}

function restoreProjectionAliases(
  projected: Record<string, unknown>,
  baseYaml: Record<string, unknown>,
  aliases: Readonly<Record<string, string>>
): Record<string, unknown> {
  const result = { ...projected }
  for (const [ruleYamlKey, treeYamlKey] of Object.entries(aliases)) {
    if (Object.hasOwn(result, ruleYamlKey)) {
      result[treeYamlKey] = result[ruleYamlKey]
      delete result[ruleYamlKey]
    }
  }
  return {
    ...Object.fromEntries(
      Object.keys(aliases).flatMap((ruleYamlKey) =>
        Object.hasOwn(baseYaml, ruleYamlKey)
          ? [[ruleYamlKey, baseYaml[ruleYamlKey]]]
          : []
      )
    ),
    ...result,
  }
}

function projectMetadataItemProperties(params: {
  readonly baseYaml: Record<string, unknown>
  readonly extensionYaml: Record<string, unknown>
  readonly baseRule: MetadataItemRule
  readonly extensionRule: MetadataItemRule
  readonly context: BaseFormProjectionContext
  readonly skippedYamlKeys?: ReadonlySet<string>
}): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const extensionRulesByYamlKey = propertyRulesByYamlKey(params.extensionRule)

  for (const [propertyKey, basePropertyRule] of Object.entries(params.baseRule.properties)) {
    const yamlKey = basePropertyRule.yaml ?? propertyKey
    if (params.skippedYamlKeys?.has(yamlKey) === true) continue
    if (!Object.hasOwn(params.baseYaml, yamlKey) || !Object.hasOwn(params.extensionYaml, yamlKey)) {
      continue
    }
    const extensionPropertyRule = extensionRulesByYamlKey.get(yamlKey)
    if (extensionPropertyRule === undefined) continue

    const baseValue = params.baseYaml[yamlKey]
    const extensionValue = params.extensionYaml[yamlKey]
    const projection = projectProperty({
      rule: basePropertyRule,
      baseValue,
      extensionValue,
      context: params.context,
    })
    if (projection.kind === "omit") continue

    const nestedProjection = projectNestedProperty({
      baseValue: projection.value,
      extensionValue,
      basePropertyRule,
      extensionPropertyRule,
      context: params.context,
    })
    if (nestedProjection.kind === "omit") continue
    if (
      nestedProjection.kind === "include" &&
      isEmptyNestedProjection(nestedProjection.value) &&
      !Object.hasOwn(basePropertyRule, "defaultValueXMLEmpty")
    ) {
      continue
    }
    result[yamlKey] =
      nestedProjection.kind === "include"
        ? nestedProjection.value
        : intersectBaseFormValues(projection.value, extensionValue)
  }

  return result
}

function isEmptyNestedProjection(value: unknown): boolean {
  if (Array.isArray(value)) return value.length === 0
  return (
    typeof value === "object" &&
    value !== null &&
    Object.keys(value).length === 0
  )
}

type NestedProjection =
  | { readonly kind: "notNested" }
  | { readonly kind: "include"; readonly value: unknown }
  | { readonly kind: "omit" }

function projectNestedProperty(params: {
  readonly baseValue: unknown
  readonly extensionValue: unknown
  readonly basePropertyRule: PropertyRule
  readonly extensionPropertyRule: PropertyRule
  readonly context: BaseFormProjectionContext
}): NestedProjection {
  const baseNestedRule = getTypeRule(params.basePropertyRule.type, "yamlToXMLNestedRule")
  if (baseNestedRule === undefined || baseNestedRule.kind === "externalFile") {
    return { kind: "notNested" }
  }
  const extensionNestedRule = getTypeRule(params.extensionPropertyRule.type, "yamlToXMLNestedRule")
  if (
    extensionNestedRule === undefined ||
    extensionNestedRule.kind === "externalFile" ||
    extensionNestedRule.kind !== baseNestedRule.kind
  ) {
    return { kind: "omit" }
  }

  if (baseNestedRule.kind === "item") {
    if (extensionNestedRule.kind !== "item") return { kind: "omit" }
    const baseYaml = asYamlRecord(params.baseValue)
    const extensionYaml = asYamlRecord(params.extensionValue)
    if (baseYaml === undefined || extensionYaml === undefined) {
      return { kind: "omit" }
    }
    return {
      kind: "include",
      value: projectAliasedMetadataItemProperties({
        baseYaml,
        extensionYaml,
        baseRule: itemRuleFromProperty(baseNestedRule, params.basePropertyRule),
        extensionRule: itemRuleFromProperty(extensionNestedRule, params.extensionPropertyRule),
        context: params.context,
      }),
    }
  }

  if (baseNestedRule.kind === "polymorphicRecord") {
    if (extensionNestedRule.kind !== "polymorphicRecord") {
      return { kind: "omit" }
    }
    const baseYaml = asYamlRecord(params.baseValue)
    const extensionYaml = asYamlRecord(params.extensionValue)
    if (baseYaml === undefined || extensionYaml === undefined) {
      return { kind: "omit" }
    }
    const value: Record<string, unknown> = {}
    for (const [name, baseItem] of Object.entries(baseYaml)) {
      if (!Object.hasOwn(extensionYaml, name)) continue
      const baseItemYaml = asYamlRecord(baseItem)
      const extensionItemYaml = asYamlRecord(extensionYaml[name])
      if (baseItemYaml === undefined || extensionItemYaml === undefined) continue
      value[name] = projectAliasedMetadataItemProperties({
        baseYaml: baseItemYaml,
        extensionYaml: extensionItemYaml,
        baseRule: baseNestedRule.resolveItemRule({ yaml: baseYaml, name }),
        extensionRule: extensionNestedRule.resolveItemRule({
          yaml: extensionYaml,
          name,
        }),
        context: params.context,
      })
    }
    return { kind: "include", value }
  }

  if (extensionNestedRule.kind !== "collection") return { kind: "omit" }
  if (baseNestedRule.yamlShape === "record") {
    const baseYaml = asYamlRecord(params.baseValue)
    const extensionYaml = asYamlRecord(params.extensionValue)
    if (baseYaml === undefined || extensionYaml === undefined) {
      return { kind: "omit" }
    }
    const value: Record<string, unknown> = {}
    let index = 0
    for (const [name, baseItem] of Object.entries(baseYaml)) {
      if (!Object.hasOwn(extensionYaml, name)) {
        index += 1
        continue
      }
      const baseItemYaml = asYamlRecord(baseItem)
      const extensionItemYaml = asYamlRecord(extensionYaml[name])
      if (baseItemYaml !== undefined && extensionItemYaml !== undefined) {
        value[name] = projectAliasedMetadataItemProperties({
          baseYaml: baseItemYaml,
          extensionYaml: extensionItemYaml,
          baseRule: collectionItemRule({
            nestedRule: baseNestedRule,
            propertyRule: params.basePropertyRule,
            yaml: baseItem,
            name,
            index,
          }),
          extensionRule: collectionItemRule({
            nestedRule: extensionNestedRule,
            propertyRule: params.extensionPropertyRule,
            yaml: extensionYaml[name],
            name,
            index,
          }),
          context: params.context,
        })
      }
      index += 1
    }
    return { kind: "include", value }
  }

  if (!Array.isArray(params.baseValue) || !Array.isArray(params.extensionValue)) {
    return { kind: "omit" }
  }
  const value: unknown[] = []
  const length = Math.min(params.baseValue.length, params.extensionValue.length)
  for (let index = 0; index < length; index += 1) {
    const baseItem = params.baseValue[index]
    const extensionItem = params.extensionValue[index]
    const baseItemYaml = asYamlRecord(baseItem)
    const extensionItemYaml = asYamlRecord(extensionItem)
    if (baseItemYaml === undefined || extensionItemYaml === undefined) continue
    value.push(
      projectAliasedMetadataItemProperties({
        baseYaml: baseItemYaml,
        extensionYaml: extensionItemYaml,
        baseRule: collectionItemRule({
          nestedRule: baseNestedRule,
          propertyRule: params.basePropertyRule,
          yaml: baseItem,
          name: undefined,
          index,
        }),
        extensionRule: collectionItemRule({
          nestedRule: extensionNestedRule,
          propertyRule: params.extensionPropertyRule,
          yaml: extensionItem,
          name: undefined,
          index,
        }),
        context: params.context,
      })
    )
  }
  return { kind: "include", value }
}

function itemRuleFromProperty(
  nestedRule: Extract<NonNullable<ReturnType<typeof getYamlToXmlNestedRule>>, { kind: "item" }>,
  propertyRule: PropertyRule
): MetadataItemRule {
  return nestedRule.itemRuleFromProperty?.(propertyRule) ?? nestedRule.itemRule
}

function collectionItemRule(params: {
  readonly nestedRule: Extract<NonNullable<ReturnType<typeof getYamlToXmlNestedRule>>, { kind: "collection" }>
  readonly propertyRule: PropertyRule
  readonly yaml: unknown
  readonly name: string | undefined
  readonly index: number
}): MetadataItemRule {
  return (
    params.nestedRule.resolveItemRule?.({
      yaml: params.yaml,
      name: params.name,
      index: params.index,
      propertyRule: params.propertyRule,
    }) ??
    params.nestedRule.itemRuleFromProperty?.(params.propertyRule) ??
    params.nestedRule.itemRule
  )
}

function getYamlToXmlNestedRule(type: string) {
  return getTypeRule(type, "yamlToXMLNestedRule")
}

function propertyRulesByYamlKey(rule: MetadataItemRule): ReadonlyMap<string, PropertyRule> {
  return new Map(
    Object.entries(rule.properties).map(([propertyKey, propertyRule]) => [
      propertyRule.yaml ?? propertyKey,
      propertyRule,
    ])
  )
}

function propertyRuleByYamlKey(rule: MetadataItemRule, yamlKey: string): PropertyRule | undefined {
  return propertyRulesByYamlKey(rule).get(yamlKey)
}

function asYamlRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function intersectNamedComponentNames(
  baseValues: Record<string, unknown> | undefined,
  extensionValues: Record<string, unknown> | undefined
): ReadonlySet<string> {
  const names = new Set<string>()
  for (const name of Object.keys(baseValues ?? {})) {
    if (Object.hasOwn(extensionValues ?? {}, name)) names.add(name)
  }
  return names
}
