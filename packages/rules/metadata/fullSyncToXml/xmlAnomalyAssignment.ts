import {
  createXmlAnomalyAnnotations,
  mergeXmlRawFragments,
  parseXmlDocumentWithSaxes,
  xmlExport,
  type XmlAnomalyAnnotation,
  type XmlAnomalyAnnotations,
  type XmlAnomalyRuntime,
} from "@nkdk/runtime"
import {
  bindDeferredObjectValues,
  currentRuleRegistrySet,
  getYAMLToXMLPlan,
  type MetadataItemRule,
  type PropertyRule,
  type RuleRegistrySet,
} from "@nkdk/runtime/rule-kit"
import type { ConfigurationContext } from "@nkdk/runtime"
import type { PreparedYamlFile } from "../project/preparedYamlProject"
import { finalizeExportedXmlValues } from "../ruleRuntime/property/finalizeExportedXML"
import type { PreparedXMLDocument, PreparedXmlAnomalyBoundary } from "./types"

export interface PreparedXmlAnomalyAssignment {
  readonly preparedYamlFile: PreparedYamlFile
  readonly itemName: string
  readonly rawBoundaries: readonly PreparedXmlAnomalyBoundary[]
}

export function prepareXmlAnomalyAssignment(params: {
  readonly preparedYamlFile: PreparedYamlFile
  readonly rootRule: MetadataItemRule
  readonly itemName: string
  readonly runtime?: XmlAnomalyRuntime
}): PreparedXmlAnomalyAssignment {
  const rootAnnotation = params.preparedYamlFile.annotations.root()
  if (rootAnnotation?.kind === "raw") {
    throw new Error("Корневой !xml/raw не поддерживается XML assignment")
  }
  if (
    rootAnnotation === undefined &&
    [...params.preparedYamlFile.annotations.entries()].length === 0
  ) {
    return {
      preparedYamlFile: params.preparedYamlFile,
      itemName: params.itemName,
      rawBoundaries: [],
    }
  }
  const rules = currentRuleRegistrySet<RuleRegistrySet>()
  const runtime = params.runtime ?? rules?.xmlAnomalies
  if (runtime === undefined) throw new Error("Не задан XmlAnomalyRuntime для XML assignment")
  const rawBoundaries: PreparedXmlAnomalyBoundary[] = []
  const semanticAnnotations = createXmlAnomalyAnnotations()
  const rootPrefix = xmlRootPrefix(params.rootRule)
  let itemName = params.itemName

  const semanticData = cloneSemanticValue({
    value: params.preparedYamlFile.data,
    sourceAnnotations: params.preparedYamlFile.annotations,
    targetAnnotations: semanticAnnotations,
    rule: params.rootRule,
    yamlPath: [],
    xmlPrefix: rootPrefix,
    rootYaml: params.preparedYamlFile.data,
    runtime,
    rules,
    rawBoundaries,
    setItemName(value) { itemName = value },
  })

  if (rootAnnotation !== undefined) semanticAnnotations.setRoot(rootAnnotation)

  return {
    itemName,
    rawBoundaries,
    preparedYamlFile: {
      ...params.preparedYamlFile,
      data: semanticData,
      annotations: semanticAnnotations,
    },
  }
}

export function buildPreparedAssignmentXml(params: {
  readonly document: PreparedXMLDocument
  readonly context: ConfigurationContext
}): string {
  const xml = cloneXmlObject(params.document.xml)
  const deferred = bindDeferredObjectValues(
    xml,
    params.document.deferred.map(({ valuePath, rulePath }) => ({ valuePath, rulePath })),
  )
  finalizeExportedXmlValues({
    xml,
    rootRule: params.document.rootRule,
    deferred,
    context: params.context,
  })
  if (params.document.rawBoundaries.length === 0) return xmlExport(xml)

  const ordinary = parseXmlDocumentWithSaxes(xmlExport(xml, false), {
    preserveXsiNil: true,
    preserveEmptyElements: true,
  }).roots
  return xmlExport(mergeXmlRawFragments(ordinary, params.document.rawBoundaries))
}

function cloneSemanticValue(params: {
  readonly value: unknown
  readonly sourceAnnotations: XmlAnomalyAnnotations
  readonly targetAnnotations: ReturnType<typeof createXmlAnomalyAnnotations>
  readonly rule: MetadataItemRule | undefined
  readonly yamlPath: readonly (string | number)[]
  readonly xmlPrefix: readonly string[]
  readonly rootYaml: unknown
  readonly runtime: XmlAnomalyRuntime
  readonly rules: RuleRegistrySet | undefined
  readonly rawBoundaries: PreparedXmlAnomalyBoundary[]
  readonly setItemName: (value: string) => void
}): unknown {
  if (Array.isArray(params.value)) {
    const target: unknown[] = []
    for (let index = 0; index < params.value.length; index += 1) {
      const annotation = params.sourceAnnotations.at(params.value, index)
      if (annotation?.kind === "raw") {
        throw new Error(`!xml/raw в YAML sequence не имеет устойчивого XML-пути: /${[...params.yamlPath, index].join("/")}`)
      }
      const child = cloneSemanticValue({ ...params, value: params.value[index], yamlPath: [...params.yamlPath, index] })
      target.push(child)
      if (annotation !== undefined) params.targetAnnotations.set(target, index, annotation)
    }
    return target
  }
  if (!isRecord(params.value)) return params.value

  const target: Record<string, unknown> = {}
  const annotationsByKey = new Map<string, XmlAnomalyAnnotation>()
  for (const entry of params.sourceAnnotations.entries()) {
    if (entry.parent === params.value && entry.key !== undefined && entry.annotation.target === "value") {
      annotationsByKey.set(String(entry.key), entry.annotation)
    }
  }
  const keys = new Set([...Object.keys(params.value), ...annotationsByKey.keys()])
  for (const runtimeKey of keys) {
    const keyAnnotation = params.sourceAnnotations.keyAt(params.value, runtimeKey)
    const logicalKey = keyAnnotation?.logicalKey ?? runtimeKey
    const annotation = annotationsByKey.get(runtimeKey)
    const property = propertyForYamlKey(params.rule, logicalKey)
    const sourceValue = Object.prototype.hasOwnProperty.call(params.value, runtimeKey)
      ? params.value[runtimeKey]
      : undefined
    if (keyAnnotation?.kind === "raw") {
      throw new Error("!xml/raw разрешён только на YAML-значении, но не на ключе")
    }

    if (annotation?.kind === "raw") {
      if (property !== undefined && isHiddenSingletonName(params, property)) {
        if (typeof sourceValue !== "string" || sourceValue.length === 0) {
          throw new Error(`Скрытое XML-имя ${params.rule?.itemType}.${property.propertyKey} должно быть непустой строкой`)
        }
        target[runtimeKey] = sourceValue
        params.setItemName(sourceValue)
        continue
      }
      params.rawBoundaries.push(rawBoundary({
        property,
        logicalKey,
        sourceValue,
        xmlPrefix: params.xmlPrefix,
        rule: params.rule,
        rootYaml: params.rootYaml,
        runtime: params.runtime,
      }))
      continue
    }

    const nested = nestedRuleForProperty(property?.propertyRule, params.rules)
    const child = cloneSemanticValue({
      ...params,
      value: sourceValue,
      rule: nested?.rule,
      yamlPath: [...params.yamlPath, logicalKey],
      xmlPrefix: property === undefined
        ? params.xmlPrefix
        : [...params.xmlPrefix, ...property.xmlPath, ...(nested?.xmlPrefix ?? [])],
    })
    target[runtimeKey] = child
    if (keyAnnotation !== undefined) params.targetAnnotations.setKey(target, runtimeKey, keyAnnotation)
    if (annotation !== undefined) params.targetAnnotations.set(target, runtimeKey, annotation)
  }
  return target
}

function rawBoundary(params: {
  readonly property: PlannedProperty | undefined
  readonly logicalKey: string
  readonly sourceValue: unknown
  readonly xmlPrefix: readonly string[]
  readonly rule: MetadataItemRule | undefined
  readonly rootYaml: unknown
  readonly runtime: XmlAnomalyRuntime
}): PreparedXmlAnomalyBoundary {
  const rawPath = params.property === undefined
    ? splitRawPath(params.logicalKey)
    : params.property.xmlPath
  const path = [...params.xmlPrefix, ...rawPath].join("\\")
  if (path.length === 0) throw new Error(`Для !xml/raw ${params.logicalKey} не определён XML-путь`)
  if (params.sourceValue === undefined) {
    if (params.property === undefined || params.rule === undefined) {
      throw new Error(`Для compact !xml/raw ${params.logicalKey} не найден PropertyRule`)
    }
    const nodes = params.runtime.generateCompactRaw({
      rule: params.rule,
      propertyKey: params.property.propertyKey,
      yaml: params.rootYaml,
    })
    if (nodes === undefined) {
      throw new Error(`Для compact !xml/raw ${params.rule.itemType}.${params.property.propertyKey} не зарегистрирован генератор`)
    }
    return {
      path,
      value: undefined,
      suppressOrdinaryOutput: true,
      fragment: { nodes, suppressOrdinaryOutput: true },
      ...(params.property.propertyRule.tag === undefined ? {} : { tag: params.property.propertyRule.tag }),
    }
  }
  return {
    path,
    value: params.sourceValue,
    suppressOrdinaryOutput: true,
    ...(params.property?.propertyRule.tag === undefined ? {} : { tag: params.property.propertyRule.tag }),
  }
}

interface PlannedProperty {
  readonly propertyKey: string
  readonly propertyRule: PropertyRule
  readonly xmlPath: readonly string[]
}

function propertyForYamlKey(rule: MetadataItemRule | undefined, yamlKey: string): PlannedProperty | undefined {
  if (rule === undefined) return undefined
  const matches = getYAMLToXMLPlan(rule).properties.filter((property) => property.yamlKey === yamlKey)
  if (matches.length > 1) throw new Error(`YAML-ключ ${rule.itemType}.${yamlKey} соответствует нескольким PropertyRule`)
  return matches[0]
}

function isHiddenSingletonName(
  params: Pick<Parameters<typeof cloneSemanticValue>[0], "runtime" | "rule">,
  property: PlannedProperty,
): boolean {
  return params.rule !== undefined && params.runtime.allowsHiddenSingletonName({
    itemType: params.rule.itemType,
    propertyKey: property.propertyKey,
    propertyType: property.propertyRule.type,
  })
}

function nestedRuleForProperty(
  propertyRule: PropertyRule | undefined,
  rules: RuleRegistrySet | undefined,
): { readonly rule: MetadataItemRule; readonly xmlPrefix: readonly string[] } | undefined {
  if (propertyRule === undefined || rules === undefined) return undefined
  const nested = rules.property.getTypeRule(propertyRule.type, "yamlToXMLNestedRule")
  if (nested?.kind !== "item" && nested?.kind !== "collection") return undefined
  const rule = nested.itemRuleFromProperty?.(propertyRule) ?? nested.itemRule
  return { rule, xmlPrefix: nested.kind === "collection" && nested.xmlElement !== undefined ? [nested.xmlElement] : [] }
}

function xmlRootPrefix(rule: MetadataItemRule): readonly string[] {
  const root = Object.values(rule.properties).find((property) =>
    property.type === "XMLRoot" && typeof property.container === "string"
  ) as (PropertyRule & { readonly container: string; readonly isFileRoot?: boolean }) | undefined
  return root === undefined || root.isFileRoot === true ? [] : [root.container]
}

function splitRawPath(key: string): readonly string[] {
  return key.split("\\")
}

function cloneXmlObject(value: Record<string, unknown>): Record<string, unknown> {
  return cloneXmlValue(value, new WeakMap()) as Record<string, unknown>
}

function cloneXmlValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (value === null || typeof value !== "object") return value
  const cached = seen.get(value)
  if (cached !== undefined) return cached

  const clone: Record<PropertyKey, unknown> | unknown[] = Array.isArray(value)
    ? new Array(value.length)
    : Object.create(Object.getPrototypeOf(value))
  seen.set(value, clone)
  for (const key of Reflect.ownKeys(value)) {
    if (Array.isArray(value) && key === "length") continue
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (descriptor === undefined) continue
    if ("value" in descriptor) descriptor.value = cloneXmlValue(descriptor.value, seen)
    Object.defineProperty(clone, key, descriptor)
  }
  return clone
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}
