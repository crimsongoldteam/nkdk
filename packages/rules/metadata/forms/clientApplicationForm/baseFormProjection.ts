import type { MetadataItemRule, PropertyRule } from "@nkdk/runtime/rule-kit"
import {
  cloneYAMLContainer,
  copyYAMLRuntimeMetadataDeep,
  createXmlAnomalyAnnotations,
  hasYAMLRuntimeMetadataAt,
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
  readonly yaml: FormElementTreeNodeYAML
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
  const rule = params.rule ?? ClientApplicationFormRules
  const rootElementCollectionRule = rule.properties.childItems
  if (rootElementCollectionRule === undefined) {
    throw new Error(
      `Правило формы ${rule.itemType} не содержит коллекцию childItems`
    )
  }
  const extensionElementsByName = indexElementsByName(params.extensionYaml.Элементы, rootElementCollectionRule)
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
  const annotations = createXmlAnomalyAnnotations()
  projectionContext.registerYAMLRuntimeCorrespondence?.(params.baseYaml, yaml)
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
  const rule = params.rule ?? ClientApplicationFormRules
  const childItems = rule.properties.childItems
  if (childItems === undefined) {
    throw new Error(`Правило формы ${rule.itemType} не содержит коллекцию childItems`)
  }
  const leftContext = createProjectionContext({
    baseYaml: params.leftBaseYaml,
    extensionYaml: params.extensionYaml,
    registerYAMLRuntimeCorrespondence: copyRuntimeMetadataForComparison,
  })
  const rightContext = createProjectionContext({
    baseYaml: params.rightBaseYaml,
    extensionYaml: params.extensionYaml,
    registerYAMLRuntimeCorrespondence: copyRuntimeMetadataForComparison,
  })
  if (!equalProjectedProperties({
    leftYaml: params.leftBaseYaml,
    rightYaml: params.rightBaseYaml,
    extensionYaml: params.extensionYaml,
    leftRule: rule,
    rightRule: rule,
    extensionRule: rule,
    leftContext,
    rightContext,
    skippedYamlKeys: new Set(["Элементы"]),
  })) return false

  const extensionElements = indexElementsByName(params.extensionYaml.Элементы, childItems)
  return equalProjectedElementTrees({
    leftElements: params.leftBaseYaml.Элементы,
    rightElements: params.rightBaseYaml.Элементы,
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
  readonly baseAnnotations?: XmlAnomalyAnnotations
  readonly extensionAnnotations?: XmlAnomalyAnnotations
}

function createProjectionContext(params: {
  readonly baseYaml: ClientApplicationFormYAML
  readonly extensionYaml: ClientApplicationFormYAML
  readonly baseAnnotations?: XmlAnomalyAnnotations
  readonly extensionAnnotations?: XmlAnomalyAnnotations
  readonly registerYAMLRuntimeCorrespondence?: (source: unknown, target: unknown) => void
}): BaseFormProjectionRuntimeContext {
  return {
    attributeNames: intersectNamedComponentNames(params.baseYaml.Реквизиты, params.extensionYaml.Реквизиты),
    commandNames: intersectNamedComponentNames(params.baseYaml.Команды, params.extensionYaml.Команды),
    parameterNames: intersectNamedComponentNames(params.baseYaml.Параметры, params.extensionYaml.Параметры),
    ...(params.baseAnnotations === undefined ? {} : { baseAnnotations: params.baseAnnotations }),
    ...(params.extensionAnnotations === undefined ? {} : { extensionAnnotations: params.extensionAnnotations }),
    ...(params.registerYAMLRuntimeCorrespondence === undefined
      ? {}
      : { registerYAMLRuntimeCorrespondence: params.registerYAMLRuntimeCorrespondence }),
  }
}

function equalProjectedElementTrees(params: {
  readonly leftElements: FormElementTreeYAML | undefined
  readonly rightElements: FormElementTreeYAML | undefined
  readonly leftCollectionRule: PropertyRule
  readonly rightCollectionRule: PropertyRule
  readonly extensionElements: ReadonlyMap<string, IndexedFormElement>
  readonly leftContext: BaseFormProjectionRuntimeContext
  readonly rightContext: BaseFormProjectionRuntimeContext
}): boolean {
  const left = params.leftElements ?? {}
  const right = params.rightElements ?? {}
  const names = new Set([...Object.keys(left), ...Object.keys(right)])
  for (const name of names) {
    const leftElement = left[name]
    const rightElement = right[name]
    if (leftElement === undefined || rightElement === undefined) return false
    const leftRule = resolveFormElementRule({
      yaml: leftElement,
      name,
      propertyRule: params.leftCollectionRule,
    })
    const rightRule = resolveFormElementRule({
      yaml: rightElement,
      name,
      propertyRule: params.rightCollectionRule,
    })
    if (!Object.is(leftElement.Вид, rightElement.Вид)) return false
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

    const leftChildrenRule = propertyRuleByYamlKey(leftRule, "Элементы")
    const rightChildrenRule = propertyRuleByYamlKey(rightRule, "Элементы")
    if (
      (leftElement.Элементы !== undefined && leftChildrenRule === undefined)
      || (rightElement.Элементы !== undefined && rightChildrenRule === undefined)
    ) return false
    if (!equalProjectedElementTrees({
      leftElements: leftElement.Элементы,
      rightElements: rightElement.Элементы,
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
  readonly leftYaml: Record<string, unknown>
  readonly rightYaml: Record<string, unknown>
  readonly extensionYaml: Record<string, unknown>
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
  const keys = projectionYamlKeys(params.leftYaml, params.rightYaml, params.leftRule, params.rightRule)
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
  leftYaml: Record<string, unknown>,
  rightYaml: Record<string, unknown>,
  leftRule: MetadataItemRule,
  rightRule?: MetadataItemRule,
): ReadonlySet<string> {
  const yamlKeys = (rule: MetadataItemRule): string[] =>
    Object.entries(rule.properties).map(([propertyKey, property]) => property.yaml ?? propertyKey)
  return new Set([
    ...yamlKeys(leftRule),
    ...(rightRule === undefined ? [] : yamlKeys(rightRule)),
    ...Object.keys(leftYaml),
    ...Object.keys(rightYaml),
  ])
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
  readonly context: BaseFormProjectionRuntimeContext
}): FormElementTreeYAML {
  const result = Object.fromEntries(
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
  params.context.registerYAMLRuntimeCorrespondence?.(params.baseElements, result)
  return result
}

function projectElementSelection(params: {
  readonly name: string
  readonly baseElement: FormElementTreeNodeYAML
  readonly baseCollectionRule: PropertyRule
  readonly extensionElement: IndexedFormElement | undefined
  readonly extensionElementsByName: ReadonlyMap<string, IndexedFormElement>
  readonly context: BaseFormProjectionRuntimeContext
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

  params.context.registerYAMLRuntimeCorrespondence?.(params.baseElement, result)

  return result
}

function projectAliasedMetadataItemProperties(params: {
  readonly baseYaml: Record<string, unknown>
  readonly extensionYaml: Record<string, unknown>
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
    baseYaml: normalizeProjectionAliases(params.baseYaml, baseAliases),
    extensionYaml: normalizeProjectionAliases(
      params.extensionYaml,
      extensionAliases
    ),
  })
  const restored = restoreProjectionAliases(
    projected,
    params.baseYaml,
    baseAliases
  )
  params.context.registerYAMLRuntimeCorrespondence?.(params.baseYaml, restored)
  return restored
}

function normalizeProjectionAliases(
  yaml: Record<string, unknown>,
  aliases: Readonly<Record<string, string>>
): Record<string, unknown> {
  const result = cloneYAMLContainer(yaml)
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
  const restored = {
    ...Object.fromEntries(
      Object.keys(aliases).flatMap((ruleYamlKey) =>
        Object.hasOwn(baseYaml, ruleYamlKey)
          ? [[ruleYamlKey, baseYaml[ruleYamlKey]]]
          : []
      )
    ),
    ...result,
  }
  return restored
}

function projectMetadataItemProperties(params: {
  readonly baseYaml: Record<string, unknown>
  readonly extensionYaml: Record<string, unknown>
  readonly baseRule: MetadataItemRule
  readonly extensionRule: MetadataItemRule
  readonly context: BaseFormProjectionRuntimeContext
  readonly skippedYamlKeys?: ReadonlySet<string>
}): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const yamlKey of projectionYamlKeys(
    params.baseYaml,
    {},
    params.baseRule,
  )) {
    if (params.skippedYamlKeys?.has(yamlKey) === true) continue
    const projection = projectMetadataItemProperty({ ...params, yamlKey })
    if (projection.kind === "omit") continue
    result[yamlKey] = projection.value
  }
  return result
}

function projectMetadataItemProperty(params: {
  readonly baseYaml: Record<string, unknown>
  readonly extensionYaml: Record<string, unknown>
  readonly baseRule: MetadataItemRule
  readonly extensionRule: MetadataItemRule
  readonly context: BaseFormProjectionRuntimeContext
  readonly yamlKey: string
  readonly baseValueKey?: string
  readonly extensionValueKey?: string
}): BaseFormPropertyProjection {
  const baseRulesByYamlKey = propertyRulesByYamlKey(params.baseRule)
  const extensionRulesByYamlKey = propertyRulesByYamlKey(params.extensionRule)
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
  if (!Object.hasOwn(params.baseYaml, baseValueKey) || !Object.hasOwn(params.extensionYaml, extensionValueKey)) {
    return { kind: "omit" }
  }

  const baseValue = params.baseYaml[baseValueKey]
  const extensionValue = params.extensionYaml[extensionValueKey]
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
  readonly baseYaml: Record<string, unknown>
  readonly extensionYaml: Record<string, unknown>
  readonly baseRulesByYamlKey: ReadonlyMap<string, PropertyRule>
  readonly extensionRulesByYamlKey: ReadonlyMap<string, PropertyRule>
  readonly context: BaseFormProjectionRuntimeContext
  readonly yamlKey: string
}): BaseFormPropertyProjection {
  if (
    params.baseRulesByYamlKey.has(params.yamlKey)
    || params.extensionRulesByYamlKey.has(params.yamlKey)
    || !Object.hasOwn(params.extensionYaml, params.yamlKey)
    || !hasYAMLRuntimeMetadataAt(params.baseYaml, params.yamlKey, params.context.baseAnnotations)
    || !hasYAMLRuntimeMetadataAt(params.extensionYaml, params.yamlKey, params.context.extensionAnnotations)
    || !Object.is(params.baseYaml[params.yamlKey], params.extensionYaml[params.yamlKey])
  ) return { kind: "omit" }
  return { kind: "include", value: params.baseYaml[params.yamlKey] }
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

function isYamlObject(value: unknown): value is object {
  return value !== null && typeof value === "object"
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
