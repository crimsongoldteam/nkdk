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
  type YAMLToXMLNestedRule,
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
  const rootPrefix = xmlRootPrefix(params.rootRule).map(xmlPathSegment)

  const semanticData = cloneSemanticValue({
    value: params.preparedYamlFile.data,
    sourceAnnotations: params.preparedYamlFile.annotations,
    targetAnnotations: semanticAnnotations,
    rule: params.rootRule,
    yamlPath: [],
    xmlPrefix: rootPrefix,
    runtime,
    rules,
    rawBoundaries,
  })

  if (rootAnnotation !== undefined) semanticAnnotations.setRoot(rootAnnotation)

  return {
    itemName: params.itemName,
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
  readonly xmlPrefix: readonly XmlTraversalPathSegment[]
  readonly runtime: XmlAnomalyRuntime
  readonly rules: RuleRegistrySet | undefined
  readonly rawBoundaries: PreparedXmlAnomalyBoundary[]
  readonly hiddenName?: HiddenSingletonNameBoundary
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
      if (logicalKey === "Имя" && params.hiddenName !== undefined) {
        params.rawBoundaries.push(hiddenSingletonNameBoundary(params.hiddenName, sourceValue))
        continue
      }
      params.rawBoundaries.push(rawBoundary({
        property,
        logicalKey,
        sourceValue,
        xmlPrefix: params.xmlPrefix,
        rule: params.rule,
        ownerYaml: params.value,
        runtime: params.runtime,
      }))
      continue
    }

    const child = property === undefined
      ? cloneSemanticValue({
          ...params,
          value: sourceValue,
          rule: undefined,
          hiddenName: undefined,
          yamlPath: [...params.yamlPath, logicalKey],
        })
      : clonePropertySemanticValue({
          ...params,
          value: sourceValue,
          property,
          yamlPath: [...params.yamlPath, logicalKey],
        })
    target[runtimeKey] = child
    if (keyAnnotation !== undefined) params.targetAnnotations.setKey(target, runtimeKey, keyAnnotation)
    if (annotation !== undefined) params.targetAnnotations.set(target, runtimeKey, annotation)
  }
  return target
}

function clonePropertySemanticValue(params: Omit<Parameters<typeof cloneSemanticValue>[0], "rule"> & {
  readonly rule: MetadataItemRule | undefined
  readonly property: PlannedProperty
}): unknown {
  const nested = nestedRuleForProperty(params.property.propertyRule, params.rules)
  const propertyPath = [
    ...params.xmlPrefix,
    ...params.property.xmlPath.map(xmlPathSegment),
  ]
  if (nested?.kind === "collection") {
    return cloneCollectionSemanticValue({ ...params, descriptor: nested, propertyPath })
  }
  if (nested?.kind === "item") {
    const itemRule = nested.itemRuleFromProperty?.(params.property.propertyRule) ?? nested.itemRule
    const hiddenName = allowsHiddenSingletonName(params, params.property)
      ? {
          path: propertyPath,
          itemType: params.rule!.itemType,
          propertyKey: params.property.propertyKey,
          ...(params.property.propertyRule.tag === undefined
            ? {}
            : { tag: params.property.propertyRule.tag }),
        }
      : undefined
    return cloneSemanticValue({
      ...params,
      rule: itemRule,
      xmlPrefix: propertyPath,
      ...(hiddenName === undefined ? { hiddenName: undefined } : { hiddenName }),
    })
  }
  if (nested?.kind === "polymorphicRecord" && isRecord(params.value)) {
    return cloneSemanticValue({
      ...params,
      rule: nested.resolveItemRule({ yaml: params.value, name: "" }),
      xmlPrefix: propertyPath,
      hiddenName: undefined,
    })
  }
  return cloneSemanticValue({
    ...params,
    rule: undefined,
    xmlPrefix: propertyPath,
    hiddenName: undefined,
  })
}

function cloneCollectionSemanticValue(params: Omit<Parameters<typeof cloneSemanticValue>[0], "rule"> & {
  readonly rule: MetadataItemRule | undefined
  readonly property: PlannedProperty
  readonly propertyPath: readonly XmlTraversalPathSegment[]
  readonly descriptor: Extract<YAMLToXMLNestedRule, { readonly kind: "collection" }>
}): unknown {
  const fallbackRule = params.descriptor.itemRuleFromProperty?.(params.property.propertyRule)
    ?? params.descriptor.itemRule
  if (params.descriptor.yamlShape === "array") {
    if (!Array.isArray(params.value)) return params.value
    const target: unknown[] = []
    params.value.forEach((item, index) => {
      const annotation = params.sourceAnnotations.at(params.value as unknown[], index)
      const rule = params.descriptor.resolveItemRule?.({
        yaml: item,
        name: undefined,
        index,
        propertyRule: params.property.propertyRule,
      }) ?? fallbackRule
      const itemPath = collectionItemPath(params.propertyPath, params.descriptor, index)
      if (annotation?.kind === "raw") {
        target.push({})
        params.rawBoundaries.push(rawItemBoundary({
          path: itemPath,
          sourceValue: item,
          tag: params.property.propertyRule.tag,
        }))
        return
      }
      const child = cloneSemanticValue({
        ...params,
        value: item,
        rule,
        yamlPath: [...params.yamlPath, index],
        xmlPrefix: itemPath,
        hiddenName: undefined,
      })
      target.push(child)
      if (annotation !== undefined) params.targetAnnotations.set(target, index, annotation)
    })
    return target
  }

  if (!isRecord(params.value)) return params.value
  const target: Record<string, unknown> = {}
  const annotationsByKey = valueAnnotationsForParent(params.sourceAnnotations, params.value)
  const keys = new Set([...Object.keys(params.value), ...annotationsByKey.keys()])
  let index = 0
  for (const runtimeKey of keys) {
    const keyAnnotation = params.sourceAnnotations.keyAt(params.value, runtimeKey)
    if (keyAnnotation?.kind === "raw") {
      throw new Error("!xml/raw разрешён только на YAML-значении, но не на ключе")
    }
    const logicalKey = keyAnnotation?.logicalKey ?? runtimeKey
    const item = Object.prototype.hasOwnProperty.call(params.value, runtimeKey)
      ? params.value[runtimeKey]
      : undefined
    const itemName = params.descriptor.nameFromYAMLKeyForProperty?.({
      yamlKey: logicalKey,
      propertyRule: params.property.propertyRule,
    }) ?? params.descriptor.nameFromYAMLKey?.(logicalKey) ?? logicalKey
    const rule = params.descriptor.resolveItemRule?.({
      yaml: item,
      name: itemName,
      index,
      propertyRule: params.property.propertyRule,
    }) ?? fallbackRule
    const annotation = annotationsByKey.get(runtimeKey)
    const itemPath = collectionItemPath(params.propertyPath, params.descriptor, index)
    if (annotation?.kind === "raw") {
      target[runtimeKey] = {}
      params.rawBoundaries.push(rawItemBoundary({
        path: itemPath,
        sourceValue: item,
        tag: params.property.propertyRule.tag,
      }))
    } else {
      target[runtimeKey] = cloneSemanticValue({
        ...params,
        value: item,
        rule,
        yamlPath: [...params.yamlPath, logicalKey],
        xmlPrefix: itemPath,
        hiddenName: undefined,
      })
      if (annotation !== undefined) params.targetAnnotations.set(target, runtimeKey, annotation)
    }
    if (keyAnnotation !== undefined) params.targetAnnotations.setKey(target, runtimeKey, keyAnnotation)
    index += 1
  }
  return target
}

function rawBoundary(params: {
  readonly property: PlannedProperty | undefined
  readonly logicalKey: string
  readonly sourceValue: unknown
  readonly xmlPrefix: readonly XmlTraversalPathSegment[]
  readonly rule: MetadataItemRule | undefined
  readonly ownerYaml: unknown
  readonly runtime: XmlAnomalyRuntime
}): PreparedXmlAnomalyBoundary {
  const rawPath = params.property === undefined
    ? splitRawPath(params.logicalKey).map(xmlPathSegment)
    : params.property.xmlPath.map(xmlPathSegment)
  const path = [...params.xmlPrefix, ...rawPath]
  if (path.length === 0) throw new Error(`Для !xml/raw ${params.logicalKey} не определён XML-путь`)
  if (params.sourceValue === undefined) {
    if (params.property === undefined || params.rule === undefined) {
      throw new Error(`Для compact !xml/raw ${params.logicalKey} не найден PropertyRule`)
    }
    const nodes = params.runtime.generateCompactRaw({
      rule: params.rule,
      propertyKey: params.property.propertyKey,
      yaml: params.ownerYaml,
    })
    if (nodes === undefined) {
      throw new Error(`Для compact !xml/raw ${params.rule.itemType}.${params.property.propertyKey} не зарегистрирован генератор`)
    }
    return {
      ...preparedPath(path),
      value: undefined,
      suppressOrdinaryOutput: true,
      fragment: { nodes, suppressOrdinaryOutput: true },
      ...(params.property.propertyRule.tag === undefined ? {} : { tag: params.property.propertyRule.tag }),
    }
  }
  return {
    ...preparedPath(path),
    value: params.sourceValue,
    suppressOrdinaryOutput: !isTerminalPath(path),
    ...(params.property?.propertyRule.tag === undefined ? {} : { tag: params.property.propertyRule.tag }),
  }
}

interface PlannedProperty {
  readonly propertyKey: string
  readonly propertyRule: PropertyRule
  readonly xmlPath: readonly string[]
}

interface XmlTraversalPathSegment {
  readonly name: string
  readonly occurrence?: number
}

interface HiddenSingletonNameBoundary {
  readonly path: readonly XmlTraversalPathSegment[]
  readonly itemType: string
  readonly propertyKey: string
  readonly tag?: string
}

const XML_NAME = /^[:_\p{L}][:_\-.0-9\p{L}\p{M}\p{N}\u00B7]*$/u

function propertyForYamlKey(rule: MetadataItemRule | undefined, yamlKey: string): PlannedProperty | undefined {
  if (rule === undefined) return undefined
  const matches = getYAMLToXMLPlan(rule).properties.filter((property) => property.yamlKey === yamlKey)
  if (matches.length > 1) throw new Error(`YAML-ключ ${rule.itemType}.${yamlKey} соответствует нескольким PropertyRule`)
  return matches[0]
}

function allowsHiddenSingletonName(
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
): YAMLToXMLNestedRule | undefined {
  if (propertyRule === undefined || rules === undefined) return undefined
  return rules.property.getTypeRule(propertyRule.type, "yamlToXMLNestedRule")
}

function collectionItemPath(
  propertyPath: readonly XmlTraversalPathSegment[],
  descriptor: Extract<YAMLToXMLNestedRule, { readonly kind: "collection" }>,
  index: number,
): readonly XmlTraversalPathSegment[] {
  if (descriptor.xmlElement !== undefined) {
    return [...propertyPath, { name: descriptor.xmlElement, occurrence: index + 1 }]
  }
  const last = propertyPath.at(-1)
  if (last === undefined) throw new Error("Для item коллекции не определён XML-путь")
  return [...propertyPath.slice(0, -1), { ...last, occurrence: index + 1 }]
}

function valueAnnotationsForParent(
  annotations: XmlAnomalyAnnotations,
  parent: object,
): Map<string, XmlAnomalyAnnotation> {
  const result = new Map<string, XmlAnomalyAnnotation>()
  for (const entry of annotations.entries()) {
    if (entry.parent === parent && entry.key !== undefined && entry.annotation.target === "value") {
      result.set(String(entry.key), entry.annotation)
    }
  }
  return result
}

function rawItemBoundary(params: {
  readonly path: readonly XmlTraversalPathSegment[]
  readonly sourceValue: unknown
  readonly tag?: string
}): PreparedXmlAnomalyBoundary {
  if (params.sourceValue === undefined) {
    throw new Error("Compact !xml/raw всего item не имеет зарегистрированной property-границы")
  }
  return {
    ...preparedPath(params.path),
    value: params.sourceValue,
    suppressOrdinaryOutput: true,
    ...(params.tag === undefined ? {} : { tag: params.tag }),
  }
}

function hiddenSingletonNameBoundary(
  boundary: HiddenSingletonNameBoundary,
  sourceValue: unknown,
): PreparedXmlAnomalyBoundary {
  if (typeof sourceValue !== "string" || sourceValue.length === 0 || !XML_NAME.test(sourceValue)) {
    throw new Error(
      `Скрытое XML-имя ${boundary.itemType}.${boundary.propertyKey} должно быть непустой допустимой XML-строкой`,
    )
  }
  return {
    ...preparedPath(boundary.path),
    value: sourceValue,
    suppressOrdinaryOutput: false,
    attributeOverride: { name: "name", value: sourceValue },
    ...(boundary.tag === undefined ? {} : { tag: boundary.tag }),
  }
}

function preparedPath(
  segments: readonly XmlTraversalPathSegment[],
): Pick<PreparedXmlAnomalyBoundary, "path" | "occurrencePath"> {
  const occurrencePath = segments.map(({ occurrence }) => occurrence ?? null)
  return {
    path: segments.map(({ name }) => name).join("\\"),
    ...(occurrencePath.some((occurrence) => occurrence !== null) ? { occurrencePath } : {}),
  }
}

function isTerminalPath(path: readonly XmlTraversalPathSegment[]): boolean {
  const terminal = path.at(-1)?.name
  return terminal === "#attributes" || terminal === "#order"
}

function xmlPathSegment(name: string): XmlTraversalPathSegment {
  return { name }
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
