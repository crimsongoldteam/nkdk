import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import {
  copyYAMLRuntimeMetadataDeep,
  createXmlAnomalyAnnotations,
  type XmlAnomalyAnnotations,
} from "@nkdk/runtime"
import { getTypeRule } from "../../ruleRuntime/property/typeRuleRegistry"
import { resolveFormElementRule } from "../elements/ruleRuntime/fromYAMLToXML"
import type { FormElementTreeNodeYAML, FormElementTreeYAML } from "../commonObjects/childItems/types"
import { getTreeNodeJSONSchemaPropertyAliases } from "../commonObjects/childItems/treeYAML"
import {
  intersectBaseFormValues,
  projectProperty,
  type BaseFormProjectionContext,
  type BaseFormPropertyProjection,
} from "./baseFormProjectionRegistry"
import { ClientApplicationFormRules } from "./rules"
import type { ClientApplicationFormYAML } from "./types"
import { equalBaseFormYaml } from "./baseFormYaml"
import { yamlBaseFormProjectionSource, type BaseFormProjectionSource } from "./baseFormProjectionSource"

export interface ProjectedBaseForm {
  readonly yaml: ClientApplicationFormYAML
  readonly annotations: ReturnType<typeof createXmlAnomalyAnnotations>
  readonly explicitComponents: {
    readonly attributes: ReadonlySet<string>
    readonly commands: ReadonlySet<string>
    readonly parameters: ReadonlySet<string>
  }
}

interface IndexedFormElement {
  readonly yaml: BaseFormProjectionSource
  readonly rule: MetadataItemRule
}

interface YAMLRuntimeCorrespondence {
  readonly source: object
  readonly target: object
}

export function projectClientApplicationBaseForm(params: {
  readonly baseYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly baseAnnotations?: XmlAnomalyAnnotations
  readonly extensionAnnotations?: XmlAnomalyAnnotations
  readonly rule?: MetadataItemRule
}): ProjectedBaseForm {
  return projectClientApplicationBaseFormSources({
    ...params,
    baseYaml: yamlBaseFormProjectionSource(params.baseYaml),
    extensionYaml: yamlBaseFormProjectionSource(params.extensionYaml),
  })
}

export function projectClientApplicationBaseFormSources(params: {
  readonly baseYaml: BaseFormProjectionSource
  readonly extensionYaml: BaseFormProjectionSource
  readonly baseAnnotations?: XmlAnomalyAnnotations
  readonly extensionAnnotations?: XmlAnomalyAnnotations
  readonly rule?: MetadataItemRule
}): ProjectedBaseForm {
  const rule = params.rule ?? ClientApplicationFormRules
  const rootElementCollectionRule = rule.properties.childItems
  if (rootElementCollectionRule === undefined) {
    throw new Error(
      `Правило формы ${rule.itemType} не содержит коллекцию childItems`
    )
  }
  const metadataCorrespondences: YAMLRuntimeCorrespondence[] = []
  const projectionContext = createProjectionContext({
    baseYaml: params.baseYaml,
    extensionYaml: params.extensionYaml,
    baseAnnotations: params.baseAnnotations,
    extensionAnnotations: params.extensionAnnotations,
    registerYAMLRuntimeCorrespondence: (source, target) => {
      if (isYamlObject(source) && isYamlObject(target)) {
        metadataCorrespondences.push({ source, target })
      }
    },
  })
  const extensionElementsByName = indexElementsByName(params.extensionYaml.child("Элементы"), rootElementCollectionRule, projectionContext)
  const properties = projectMetadataItemProperties({
    baseYaml: params.baseYaml,
    extensionYaml: params.extensionYaml,
    baseRule: rule,
    extensionRule: rule,
    context: projectionContext,
    skippedYamlKeys: new Set(["Элементы"]),
  })
  const baseElements = params.baseYaml.child("Элементы")
  const elements =
    baseElements === undefined
      ? undefined
      : projectElementTree({
          baseElements,
          baseCollectionRule: rootElementCollectionRule,
          extensionElementsByName,
          context: projectionContext,
        })
  const yaml = {
    ...properties,
    ...(elements === undefined ? {} : { Элементы: elements }),
  } as ClientApplicationFormYAML
  const annotations = createXmlAnomalyAnnotations()
  projectionContext.registerYAMLRuntimeCorrespondence?.(params.baseYaml.metadataSource, yaml)
  for (const correspondence of metadataCorrespondences) {
    copyYAMLRuntimeMetadataDeep({
      ...correspondence,
      ...(params.baseAnnotations === undefined
        ? {}
        : { sourceAnnotations: params.baseAnnotations, targetAnnotations: annotations }),
    })
  }

  return {
    yaml,
    annotations,
    explicitComponents: {
      attributes: projectionContext.attributeNames,
      commands: projectionContext.commandNames,
      parameters: projectionContext.parameterNames,
    },
  }
}

/**
 * Compares the two effective BaseForm projections incrementally.  Unlike
 * projectClientApplicationBaseForm(), this does not retain either complete
 * projection and stops on the first meaningful difference.
 */
export function equalClientApplicationBaseFormProjections(params: {
  readonly leftBaseYaml: ClientApplicationFormYAML
  readonly rightBaseYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly rule?: MetadataItemRule
}): boolean {
  return equalClientApplicationBaseFormSourceProjections({
    leftBase: yamlBaseFormProjectionSource(params.leftBaseYaml),
    rightBase: yamlBaseFormProjectionSource(params.rightBaseYaml),
    extension: yamlBaseFormProjectionSource(params.extensionYaml),
    rule: params.rule,
  })
}

export function equalClientApplicationBaseFormSourceProjections(params: {
  readonly leftBase: BaseFormProjectionSource
  readonly rightBase: BaseFormProjectionSource
  readonly extension: BaseFormProjectionSource
  readonly rule?: MetadataItemRule
}): boolean {
  const rule = params.rule ?? ClientApplicationFormRules
  const childItems = rule.properties.childItems
  if (childItems === undefined) {
    throw new Error(`Правило формы ${rule.itemType} не содержит коллекцию childItems`)
  }
  const leftContext = createProjectionContext({
    baseYaml: params.leftBase,
    extensionYaml: params.extension,
    registerYAMLRuntimeCorrespondence: copyRuntimeMetadataForComparison,
  })
  const rightContext = createProjectionContext({
    baseYaml: params.rightBase,
    extensionYaml: params.extension,
    registerYAMLRuntimeCorrespondence: copyRuntimeMetadataForComparison,
  })
  if (!equalProjectedProperties({
    leftYaml: params.leftBase,
    rightYaml: params.rightBase,
    extensionYaml: params.extension,
    leftRule: rule,
    rightRule: rule,
    extensionRule: rule,
    leftContext,
    rightContext,
    skippedYamlKeys: new Set(["Элементы"]),
  })) return false

  const extensionElements = indexElementsByName(params.extension.child("Элементы"), childItems, leftContext)
  return equalProjectedElementTrees({
    leftElements: params.leftBase.child("Элементы"),
    rightElements: params.rightBase.child("Элементы"),
    leftCollectionRule: childItems,
    rightCollectionRule: childItems,
    extensionElements,
    leftContext,
    rightContext,
  })
}

function copyRuntimeMetadataForComparison(source: unknown, target: unknown): void {
  if (isYamlObject(source) && isYamlObject(target)) {
    copyYAMLRuntimeMetadataDeep({ source, target })
  }
}

interface BaseFormProjectionRuntimeContext extends BaseFormProjectionContext {
  readonly rulesByYamlKey: (rule: MetadataItemRule) => ReadonlyMap<string, PropertyRule>
  readonly baseAnnotations?: XmlAnomalyAnnotations
  readonly extensionAnnotations?: XmlAnomalyAnnotations
}

function createProjectionContext(params: {
  readonly baseYaml: BaseFormProjectionSource
  readonly extensionYaml: BaseFormProjectionSource
  readonly baseAnnotations?: XmlAnomalyAnnotations
  readonly extensionAnnotations?: XmlAnomalyAnnotations
  readonly registerYAMLRuntimeCorrespondence?: (source: unknown, target: unknown) => void
}): BaseFormProjectionRuntimeContext {
  const preparedRules = new Map<MetadataItemRule, ReadonlyMap<string, PropertyRule>>()
  return {
    rulesByYamlKey(rule) {
      let prepared = preparedRules.get(rule)
      if (prepared === undefined) {
        prepared = propertyRulesByYamlKey(rule)
        preparedRules.set(rule, prepared)
      }
      return prepared
    },
    attributeNames: intersectNamedComponentNames(params.baseYaml.child("Реквизиты"), params.extensionYaml.child("Реквизиты")),
    commandNames: intersectNamedComponentNames(params.baseYaml.child("Команды"), params.extensionYaml.child("Команды")),
    parameterNames: intersectNamedComponentNames(params.baseYaml.child("Параметры"), params.extensionYaml.child("Параметры")),
    ...(params.baseAnnotations === undefined ? {} : { baseAnnotations: params.baseAnnotations }),
    ...(params.extensionAnnotations === undefined ? {} : { extensionAnnotations: params.extensionAnnotations }),
    ...(params.registerYAMLRuntimeCorrespondence === undefined
      ? {}
      : { registerYAMLRuntimeCorrespondence: params.registerYAMLRuntimeCorrespondence }),
  }
}

function equalProjectedElementTrees(params: {
  readonly leftElements: BaseFormProjectionSource | undefined
  readonly rightElements: BaseFormProjectionSource | undefined
  readonly leftCollectionRule: PropertyRule
  readonly rightCollectionRule: PropertyRule
  readonly extensionElements: ReadonlyMap<string, IndexedFormElement>
  readonly leftContext: BaseFormProjectionRuntimeContext
  readonly rightContext: BaseFormProjectionRuntimeContext
}): boolean {
  const left = params.leftElements
  const right = params.rightElements
  const names = new Set([...(left?.keys() ?? []), ...(right?.keys() ?? [])])
  for (const name of names) {
    const leftElement = left?.child(name)
    const rightElement = right?.child(name)
    if (leftElement === undefined || rightElement === undefined) return false
    const leftRule = resolveFormElementRule({
      yaml: { Вид: leftElement.read("Вид") },
      name,
      propertyRule: params.leftCollectionRule,
    })
    const rightRule = resolveFormElementRule({
      yaml: { Вид: rightElement.read("Вид") },
      name,
      propertyRule: params.rightCollectionRule,
    })
    if (!Object.is(leftElement.read("Вид"), rightElement.read("Вид"))) return false
    const extension = params.extensionElements.get(name)
    if (extension !== undefined) {
      if (!equalProjectedProperties({
        leftYaml: leftElement,
        rightYaml: rightElement,
        extensionYaml: extension.yaml,
        leftRule,
        rightRule,
        extensionRule: extension.rule,
        leftContext: params.leftContext,
        rightContext: params.rightContext,
        leftAliases: getTreeNodeJSONSchemaPropertyAliases(leftRule.itemType),
        rightAliases: getTreeNodeJSONSchemaPropertyAliases(rightRule.itemType),
        extensionAliases: getTreeNodeJSONSchemaPropertyAliases(extension.rule.itemType),
        skippedYamlKeys: new Set(["Элементы"]),
      })) return false
    }

    const leftChildrenRule = params.leftContext.rulesByYamlKey(leftRule).get("Элементы")
    const rightChildrenRule = params.rightContext.rulesByYamlKey(rightRule).get("Элементы")
    const leftChildren = leftElement.child("Элементы")
    const rightChildren = rightElement.child("Элементы")
    if (
      (leftChildren !== undefined && leftChildrenRule === undefined)
      || (rightChildren !== undefined && rightChildrenRule === undefined)
    ) return false
    if (!equalProjectedElementTrees({
      leftElements: leftChildren,
      rightElements: rightChildren,
      leftCollectionRule: leftChildrenRule ?? params.leftCollectionRule,
      rightCollectionRule: rightChildrenRule ?? params.rightCollectionRule,
      extensionElements: params.extensionElements,
      leftContext: params.leftContext,
      rightContext: params.rightContext,
    })) return false
  }
  return true
}

function equalProjectedProperties(params: {
  readonly leftYaml: BaseFormProjectionSource
  readonly rightYaml: BaseFormProjectionSource
  readonly extensionYaml: BaseFormProjectionSource
  readonly leftRule: MetadataItemRule
  readonly rightRule: MetadataItemRule
  readonly extensionRule: MetadataItemRule
  readonly leftContext: BaseFormProjectionRuntimeContext
  readonly rightContext: BaseFormProjectionRuntimeContext
  readonly skippedYamlKeys?: ReadonlySet<string>
  readonly leftAliases?: Readonly<Record<string, string>>
  readonly rightAliases?: Readonly<Record<string, string>>
  readonly extensionAliases?: Readonly<Record<string, string>>
}): boolean {
  const keys = projectionYamlKeys(
    params.leftYaml, params.rightYaml,
    params.leftContext.rulesByYamlKey(params.leftRule),
    params.rightContext.rulesByYamlKey(params.rightRule),
  )
  for (const yamlKey of keys) {
    if (params.skippedYamlKeys?.has(yamlKey) === true || isXmlServiceYamlKey(yamlKey)) continue
    const left = projectMetadataItemProperty({
      baseYaml: params.leftYaml,
      extensionYaml: params.extensionYaml,
      baseRule: params.leftRule,
      extensionRule: params.extensionRule,
      context: params.leftContext,
      yamlKey,
      baseValueKey: params.leftAliases?.[yamlKey],
      extensionValueKey: params.extensionAliases?.[yamlKey],
    })
    const right = projectMetadataItemProperty({
      baseYaml: params.rightYaml,
      extensionYaml: params.extensionYaml,
      baseRule: params.rightRule,
      extensionRule: params.extensionRule,
      context: params.rightContext,
      yamlKey,
      baseValueKey: params.rightAliases?.[yamlKey],
      extensionValueKey: params.extensionAliases?.[yamlKey],
    })
    if (left.kind !== right.kind) return false
    if (
      left.kind === "include"
      && right.kind === "include"
      && !equalBaseFormYaml(left.value, right.value)
    ) return false
  }
  return true
}

function isXmlServiceYamlKey(key: string): boolean {
  return key === "_id"
    || key === "_uuid"
    || key === "_version"
    || key === "_xmlns"
    || key.startsWith("_xmlns:")
}

function projectionYamlKeys(
  leftYaml: BaseFormProjectionSource,
  rightYaml: BaseFormProjectionSource | undefined,
  leftRules: ReadonlyMap<string, PropertyRule>,
  rightRules?: ReadonlyMap<string, PropertyRule>,
): ReadonlySet<string> {
  return new Set([
    ...leftRules.keys(),
    ...(rightRules === undefined ? [] : rightRules.keys()),
    ...leftYaml.keys(),
    ...(rightYaml?.keys() ?? []),
  ])
}

function indexElementsByName(
  elements: BaseFormProjectionSource | undefined,
  collectionRule: PropertyRule,
  context: BaseFormProjectionRuntimeContext,
): ReadonlyMap<string, IndexedFormElement> {
  const result = new Map<string, IndexedFormElement>()

  visitElementTree(elements, collectionRule, context, (name, element, rule) => {
    if (result.has(name)) {
      throw new Error(`External form contains duplicate element name "${name}"`)
    }
    result.set(name, { yaml: element, rule })
  })

  return result
}

function visitElementTree(
  elements: BaseFormProjectionSource | undefined,
  collectionRule: PropertyRule,
  context: BaseFormProjectionRuntimeContext,
  visit: (name: string, element: BaseFormProjectionSource, rule: MetadataItemRule) => void
): void {
  if (elements === undefined) return

  for (const name of elements.keys()) {
    const element = elements.child(name)!
    const rule = resolveFormElementRule({
      yaml: { Вид: element.read("Вид") },
      name,
      propertyRule: collectionRule,
    })
    visit(name, element, rule)

    const children = element.child("Элементы")
    if (children === undefined) continue
    const childCollectionRule = context.rulesByYamlKey(rule).get("Элементы")
    if (childCollectionRule === undefined) {
      throw new Error(`Element "${name}" does not define the YAML property "Элементы"`)
    }
    visitElementTree(children, childCollectionRule, context, visit)
  }
}

function projectElementTree(params: {
  readonly baseElements: BaseFormProjectionSource
  readonly baseCollectionRule: PropertyRule
  readonly extensionElementsByName: ReadonlyMap<string, IndexedFormElement>
  readonly context: BaseFormProjectionRuntimeContext
}): FormElementTreeYAML {
  const result = Object.fromEntries(
    params.baseElements.keys().map((name) => [
      name,
      projectElementSelection({
        name,
        baseElement: params.baseElements.child(name)!,
        baseCollectionRule: params.baseCollectionRule,
        extensionElement: params.extensionElementsByName.get(name),
        extensionElementsByName: params.extensionElementsByName,
        context: params.context,
      }),
    ])
  )
  params.context.registerYAMLRuntimeCorrespondence?.(params.baseElements.metadataSource, result)
  return result
}

function projectElementSelection(params: {
  readonly name: string
  readonly baseElement: BaseFormProjectionSource
  readonly baseCollectionRule: PropertyRule
  readonly extensionElement: IndexedFormElement | undefined
  readonly extensionElementsByName: ReadonlyMap<string, IndexedFormElement>
  readonly context: BaseFormProjectionRuntimeContext
}): FormElementTreeNodeYAML {
  const baseRule = resolveFormElementRule({
    yaml: { Вид: params.baseElement.read("Вид") },
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
    Вид: params.baseElement.read("Вид") as FormElementTreeNodeYAML["Вид"],
    ...properties,
  }

  const children = params.baseElement.child("Элементы")
  if (children !== undefined) {
    const childCollectionRule = params.context.rulesByYamlKey(baseRule).get("Элементы")
    if (childCollectionRule === undefined) {
      throw new Error(`Element "${params.name}" does not define the YAML property "Элементы"`)
    }
    result.Элементы = projectElementTree({
      baseElements: children,
      baseCollectionRule: childCollectionRule,
      extensionElementsByName: params.extensionElementsByName,
      context: params.context,
    })
  }

  params.context.registerYAMLRuntimeCorrespondence?.(params.baseElement.metadataSource, result)

  return result
}

function projectAliasedMetadataItemProperties(params: {
  readonly baseYaml: BaseFormProjectionSource
  readonly extensionYaml: BaseFormProjectionSource
  readonly baseRule: MetadataItemRule
  readonly extensionRule: MetadataItemRule
  readonly context: BaseFormProjectionRuntimeContext
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
    baseAliases,
    extensionAliases,
  })
  const restored = restoreProjectionAliases(
    projected,
    params.baseYaml,
    baseAliases
  )
  params.context.registerYAMLRuntimeCorrespondence?.(params.baseYaml.metadataSource, restored)
  return restored
}

function restoreProjectionAliases(
  projected: Record<string, unknown>,
  baseYaml: BaseFormProjectionSource,
  aliases: Readonly<Record<string, string>>
): Record<string, unknown> {
  const result = { ...projected }
  for (const [ruleYamlKey, treeYamlKey] of Object.entries(aliases)) {
    if (Object.hasOwn(result, ruleYamlKey)) {
      result[treeYamlKey] = result[ruleYamlKey]
      delete result[ruleYamlKey]
    }
  }
  const restored = {
    ...Object.fromEntries(
      Object.keys(aliases).flatMap((ruleYamlKey) =>
        baseYaml.has(ruleYamlKey)
          ? [[ruleYamlKey, baseYaml.read(ruleYamlKey)]]
          : []
      )
    ),
    ...result,
  }
  return restored
}

function projectMetadataItemProperties(params: {
  readonly baseYaml: BaseFormProjectionSource
  readonly extensionYaml: BaseFormProjectionSource
  readonly baseRule: MetadataItemRule
  readonly extensionRule: MetadataItemRule
  readonly context: BaseFormProjectionRuntimeContext
  readonly skippedYamlKeys?: ReadonlySet<string>
  readonly baseAliases?: Readonly<Record<string, string>>
  readonly extensionAliases?: Readonly<Record<string, string>>
}): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const yamlKey of projectionYamlKeys(
    params.baseYaml,
    undefined,
    params.context.rulesByYamlKey(params.baseRule),
  )) {
    if (params.skippedYamlKeys?.has(yamlKey) === true) continue
    const projection = projectMetadataItemProperty({
      ...params, yamlKey,
      baseValueKey: params.baseAliases?.[yamlKey],
      extensionValueKey: params.extensionAliases?.[yamlKey],
    })
    if (projection.kind === "omit") continue
    result[yamlKey] = projection.value
  }
  return result
}

function projectMetadataItemProperty(params: {
  readonly baseYaml: BaseFormProjectionSource
  readonly extensionYaml: BaseFormProjectionSource
  readonly baseRule: MetadataItemRule
  readonly extensionRule: MetadataItemRule
  readonly context: BaseFormProjectionRuntimeContext
  readonly yamlKey: string
  readonly baseValueKey?: string
  readonly extensionValueKey?: string
}): BaseFormPropertyProjection {
  const baseRulesByYamlKey = params.context.rulesByYamlKey(params.baseRule)
  const extensionRulesByYamlKey = params.context.rulesByYamlKey(params.extensionRule)
  const basePropertyRule = baseRulesByYamlKey.get(params.yamlKey)
  const extensionPropertyRule = extensionRulesByYamlKey.get(params.yamlKey)
  if (basePropertyRule === undefined || extensionPropertyRule === undefined) {
    return projectSharedRuntimeProperty({
      ...params,
      baseRulesByYamlKey,
      extensionRulesByYamlKey,
    })
  }
  const baseValueKey = params.baseValueKey ?? params.yamlKey
  const extensionValueKey = params.extensionValueKey ?? params.yamlKey
  if (!params.baseYaml.has(baseValueKey) || !params.extensionYaml.has(extensionValueKey)) {
    return { kind: "omit" }
  }

  const baseValue = params.baseYaml.read(baseValueKey)
  const extensionValue = params.extensionYaml.read(extensionValueKey)
  const projection = projectProperty({
    rule: basePropertyRule,
    baseValue,
    extensionValue,
    context: params.context,
  })
  if (projection.kind === "omit") return projection

  const nestedProjection = projectNestedProperty({
    baseValue: projection.value,
    extensionValue,
    basePropertyRule,
    extensionPropertyRule,
    context: params.context,
  })
  if (nestedProjection.kind === "omit") return nestedProjection
  if (
    nestedProjection.kind === "include" &&
    isEmptyNestedProjection(nestedProjection.value) &&
    !Object.hasOwn(basePropertyRule, "defaultValueXMLEmpty")
  ) {
    return { kind: "omit" }
  }
  return {
    kind: "include",
    value: nestedProjection.kind === "include"
      ? nestedProjection.value
      : intersectBaseFormValues(
          projection.value,
          extensionValue,
          params.context.registerYAMLRuntimeCorrespondence,
        ),
  }
}

function projectSharedRuntimeProperty(params: {
  readonly baseYaml: BaseFormProjectionSource
  readonly extensionYaml: BaseFormProjectionSource
  readonly baseRulesByYamlKey: ReadonlyMap<string, PropertyRule>
  readonly extensionRulesByYamlKey: ReadonlyMap<string, PropertyRule>
  readonly context: BaseFormProjectionRuntimeContext
  readonly yamlKey: string
}): BaseFormPropertyProjection {
  if (
    params.baseRulesByYamlKey.has(params.yamlKey)
    || params.extensionRulesByYamlKey.has(params.yamlKey)
    || !params.extensionYaml.has(params.yamlKey)
    || !params.baseYaml.hasRuntimeMetadata(params.yamlKey, params.context.baseAnnotations)
    || !params.extensionYaml.hasRuntimeMetadata(params.yamlKey, params.context.extensionAnnotations)
    || !Object.is(params.baseYaml.read(params.yamlKey), params.extensionYaml.read(params.yamlKey))
  ) return { kind: "omit" }
  return { kind: "include", value: params.baseYaml.read(params.yamlKey) }
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
  readonly context: BaseFormProjectionRuntimeContext
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
        baseYaml: yamlBaseFormProjectionSource(baseYaml),
        extensionYaml: yamlBaseFormProjectionSource(extensionYaml),
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
        baseYaml: yamlBaseFormProjectionSource(baseItemYaml),
        extensionYaml: yamlBaseFormProjectionSource(extensionItemYaml),
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
          baseYaml: yamlBaseFormProjectionSource(baseItemYaml),
          extensionYaml: yamlBaseFormProjectionSource(extensionItemYaml),
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
        baseYaml: yamlBaseFormProjectionSource(baseItemYaml),
        extensionYaml: yamlBaseFormProjectionSource(extensionItemYaml),
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

function asYamlRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function isYamlObject(value: unknown): value is object {
  return value !== null && typeof value === "object"
}

function intersectNamedComponentNames(
  baseValues: BaseFormProjectionSource | undefined,
  extensionValues: BaseFormProjectionSource | undefined
): ReadonlySet<string> {
  const names = new Set<string>()
  for (const name of baseValues?.keys() ?? []) {
    if (extensionValues?.has(name)) names.add(name)
  }
  return names
}
