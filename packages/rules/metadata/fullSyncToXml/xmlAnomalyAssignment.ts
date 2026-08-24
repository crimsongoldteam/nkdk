import {
  createXmlAnomalyAnnotations,
  appendXmlAnomalyRawCollectionItem,
  markXmlAnomalyExportClaim,
  markXmlAnomalyRawItem,
  mergeXmlRawFragments,
  markYAMLScalarTag,
  parseXmlDocumentWithSaxes,
  readXmlAnomalyExportClaim,
  yamlMappingKeys,
  yamlScalarTagAt,
  xmlExport,
  type XmlAnomalyAnnotation,
  type XmlAnomalyAnnotations,
  type XmlAnomalyRuntime,
  type XmlElementNode,
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
  readonly mode?: "preserve" | "projectionOnly"
}): PreparedXmlAnomalyAssignment {
  const rootAnnotation = params.preparedYamlFile.annotations.root()
  if (rootAnnotation?.kind === "raw") {
    if (params.mode === "projectionOnly") {
      return {
        itemName: params.itemName,
        rawBoundaries: [],
        preparedYamlFile: {
          ...params.preparedYamlFile,
          data: {},
          annotations: createXmlAnomalyAnnotations(),
        },
      }
    }
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
  const exportClaims = { nextId: 1 }
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
    exportClaims,
    mode: params.mode ?? "preserve",
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

  const resolvedBoundaries = resolveExportClaimBoundaries(xml, params.document.rawBoundaries)
  const ordinary = parseXmlDocumentWithSaxes(xmlExport(xml, false), {
    preserveXsiNil: true,
    preserveEmptyElements: true,
  }).roots
  return xmlExport(mergeXmlRawFragments(ordinary, resolvedBoundaries))
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
  readonly exportClaims: { nextId: number }
  readonly exportClaimId?: string
  readonly hiddenName?: HiddenSingletonNameBoundary
  readonly mode: "preserve" | "projectionOnly"
}): unknown {
  if (Array.isArray(params.value)) {
    const target: unknown[] = []
    for (let index = 0; index < params.value.length; index += 1) {
      const annotation = params.sourceAnnotations.at(params.value, index)
      if (annotation?.kind === "raw") {
        if (params.mode === "projectionOnly") continue
        throw new Error(`!xml/raw в YAML sequence не имеет устойчивого XML-пути: /${[...params.yamlPath, index].join("/")}`)
      }
      const child = cloneSemanticValue({ ...params, value: params.value[index], yamlPath: [...params.yamlPath, index] })
      target.push(child)
      const targetIndex = target.length - 1
      copySequenceEntryMetadata(params.value, params.targetAnnotations, index, target, targetIndex, annotation)
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
    const { keyAnnotation, logicalKey, targetKey } = mappingEntryIdentity(params, target, runtimeKey)
    const annotation = annotationsByKey.get(runtimeKey)
    const property = propertyForYamlKey(params.rule, logicalKey)
    const sourceValue = Object.prototype.hasOwnProperty.call(params.value, runtimeKey)
      ? params.value[runtimeKey]
      : undefined
    if (keyAnnotation?.kind === "raw") {
      throw new Error("!xml/raw разрешён только на YAML-значении, но не на ключе")
    }
    if (annotation?.kind === "raw") {
      const propertyState = yamlScalarTagAt(params.value, runtimeKey)
      if (property !== undefined && isPropertyStateTag(propertyState)) {
        target[targetKey] = undefined
        markYAMLScalarTag(target, targetKey, propertyState)
      }
      if (params.mode === "projectionOnly") continue
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
        exportClaimId: params.exportClaimId,
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
    target[targetKey] = child
    const scalarTag = yamlScalarTagAt(params.value, runtimeKey)
    if (scalarTag !== undefined) markYAMLScalarTag(target, targetKey, scalarTag)
    if (keyAnnotation !== undefined) params.targetAnnotations.setKey(target, targetKey, keyAnnotation)
    if (annotation !== undefined) params.targetAnnotations.set(target, targetKey, annotation)
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
    return cloneCollectionSemanticValue({ ...params, descriptor: nested })
  }
  if (nested?.kind === "item") {
    const itemRule = nested.itemRuleFromProperty?.(params.property.propertyRule) ?? nested.itemRule
    const hiddenName = allowsHiddenSingletonName(params, params.property)
      ? {
          path: propertyPath,
          itemType: params.rule!.itemType,
          propertyKey: params.property.propertyKey,
          ...(params.exportClaimId === undefined ? {} : { exportClaimId: params.exportClaimId }),
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
  readonly descriptor: Extract<YAMLToXMLNestedRule, { readonly kind: "collection" }>
}): unknown {
  const fallbackRule = params.descriptor.itemRuleFromProperty?.(params.property.propertyRule)
    ?? params.descriptor.itemRule
  if (params.descriptor.yamlShape === "array") {
    if (!Array.isArray(params.value)) return params.value
    const source = params.value
    const target: unknown[] = []
    source.forEach((item, index) => {
      const annotation = params.sourceAnnotations.at(source, index)
      if (annotation?.kind === "raw") {
        if (params.mode === "projectionOnly") return
        const exportClaimId = nextExportClaimId(params.exportClaims)
        const semanticItem = {}
        markXmlAnomalyRawItem(semanticItem, exportClaimId)
        appendXmlAnomalyRawCollectionItem(target, { index, yaml: semanticItem })
        params.rawBoundaries.push(rawItemBoundary({
          sourceValue: item,
          tag: params.property.propertyRule.tag,
          exportClaimId,
        }))
        return
      }
      const exportClaimId = params.mode === "preserve" && hasRawDescendant(item, params.sourceAnnotations)
        ? nextExportClaimId(params.exportClaims)
        : undefined
      const rule = params.descriptor.resolveItemRule?.({
        yaml: item,
        name: undefined,
        index,
        propertyRule: params.property.propertyRule,
      }) ?? fallbackRule
      const child = cloneSemanticValue({
        ...params,
        value: item,
        rule,
        yamlPath: [...params.yamlPath, index],
        xmlPrefix: [],
        exportClaimId,
        hiddenName: undefined,
      })
      if (exportClaimId !== undefined) markXmlAnomalyExportClaim(child, exportClaimId)
      target.push(child)
      const targetIndex = target.length - 1
      copySequenceEntryMetadata(source, params.targetAnnotations, index, target, targetIndex, annotation)
    })
    return target
  }

  if (!isRecord(params.value)) return params.value
  const target: Record<string, unknown> = {}
  const annotationsByKey = valueAnnotationsForParent(params.sourceAnnotations, params.value)
  const keys = new Set([...Object.keys(params.value), ...annotationsByKey.keys()])
  let index = 0
  for (const runtimeKey of keys) {
    const { keyAnnotation, logicalKey, targetKey } = mappingEntryIdentity(params, target, runtimeKey)
    const item = Object.prototype.hasOwnProperty.call(params.value, runtimeKey)
      ? params.value[runtimeKey]
      : undefined
    const itemName = params.descriptor.nameFromYAMLKeyForProperty?.({
      yamlKey: logicalKey,
      propertyRule: params.property.propertyRule,
    }) ?? params.descriptor.nameFromYAMLKey?.(logicalKey) ?? logicalKey
    const annotation = annotationsByKey.get(runtimeKey)
    if (keyAnnotation?.kind === "raw") {
      throw new Error("!xml/raw разрешён только на YAML-значении, но не на ключе")
    }
    if (annotation?.kind === "raw") {
      if (params.mode === "projectionOnly") {
        index += 1
        continue
      }
      const exportClaimId = nextExportClaimId(params.exportClaims)
      const semanticItem = {}
      markXmlAnomalyRawItem(semanticItem, exportClaimId)
      appendXmlAnomalyRawCollectionItem(target, {
        index,
        yaml: semanticItem,
        name: itemName,
      })
      params.rawBoundaries.push(rawItemBoundary({
        sourceValue: item,
        tag: params.property.propertyRule.tag,
        exportClaimId,
      }))
    } else {
      const exportClaimId = params.mode === "preserve" && hasRawDescendant(item, params.sourceAnnotations)
        ? nextExportClaimId(params.exportClaims)
        : undefined
      const rule = params.descriptor.resolveItemRule?.({
        yaml: item,
        name: itemName,
        index,
        propertyRule: params.property.propertyRule,
      }) ?? fallbackRule
      target[targetKey] = cloneSemanticValue({
        ...params,
        value: item,
        rule,
        yamlPath: [...params.yamlPath, logicalKey],
        xmlPrefix: [],
        exportClaimId,
        hiddenName: undefined,
      })
      const scalarTag = yamlScalarTagAt(params.value, runtimeKey)
      if (scalarTag !== undefined) markYAMLScalarTag(target, targetKey, scalarTag)
      if (exportClaimId !== undefined) {
        markXmlAnomalyExportClaim(target[targetKey], exportClaimId)
      }
      if (annotation !== undefined) params.targetAnnotations.set(target, targetKey, annotation)
    }
    if (keyAnnotation !== undefined) params.targetAnnotations.setKey(target, targetKey, keyAnnotation)
    index += 1
  }
  return target
}

function copySequenceEntryMetadata(
  source: readonly unknown[],
  targetAnnotations: ReturnType<typeof createXmlAnomalyAnnotations>,
  sourceIndex: number,
  target: unknown[],
  targetIndex: number,
  annotation: XmlAnomalyAnnotation | undefined,
): void {
  const scalarTag = yamlScalarTagAt(source, sourceIndex)
  if (scalarTag !== undefined) markYAMLScalarTag(target, targetIndex, scalarTag)
  if (annotation !== undefined) targetAnnotations.set(target, targetIndex, annotation)
}

function isPropertyStateTag(tag: unknown): tag is "проверять" | "изменять" {
  return tag === "проверять" || tag === "изменять"
}

function mappingEntryIdentity(
  params: Pick<Parameters<typeof cloneSemanticValue>[0], "value" | "sourceAnnotations">,
  target: Record<string, unknown>,
  runtimeKey: string,
): {
  readonly keyAnnotation: XmlAnomalyAnnotation | undefined
  readonly logicalKey: string
  readonly targetKey: string
} {
  const keyAnnotation = params.sourceAnnotations.keyAt(params.value as object, runtimeKey)
  const logicalKey = keyAnnotation?.logicalKey ?? runtimeKey
  const targetKey = keyAnnotation !== undefined && !Object.prototype.hasOwnProperty.call(target, logicalKey)
    ? logicalKey
    : runtimeKey
  return { keyAnnotation, logicalKey, targetKey }
}

function hasRawDescendant(
  value: unknown,
  annotations: XmlAnomalyAnnotations,
  seen = new WeakSet<object>(),
): boolean {
  if (value === null || typeof value !== "object" || seen.has(value)) return false
  seen.add(value)
  const keys: readonly (string | number)[] = Array.isArray(value)
    ? value.map((_item, index) => index)
    : Object.keys(value)
  for (const key of keys) {
    if (annotations.at(value, key)?.kind === "raw") return true
    if (typeof key === "string" && annotations.keyAt(value, key)?.kind === "raw") return true
    if (hasRawDescendant((value as Record<string | number, unknown>)[key], annotations, seen)) {
      return true
    }
  }
  return false
}

function rawBoundary(params: {
  readonly property: PlannedProperty | undefined
  readonly logicalKey: string
  readonly sourceValue: unknown
  readonly xmlPrefix: readonly XmlTraversalPathSegment[]
  readonly rule: MetadataItemRule | undefined
  readonly ownerYaml: unknown
  readonly runtime: XmlAnomalyRuntime
  readonly exportClaimId?: string
}): PreparedXmlAnomalyBoundary {
  const rawPath = params.property === undefined
    ? splitRawPath(params.logicalKey).map(xmlPathSegment)
    : params.property.xmlPath.map(xmlPathSegment)
  const path = params.exportClaimId === undefined
    ? [...params.xmlPrefix, ...rawPath]
    : rawPath
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
      ...(params.exportClaimId === undefined ? {} : { exportClaimId: params.exportClaimId }),
    }
  }
  const siblingOrder = params.property === undefined
    ? rawSiblingOrder(params.ownerYaml, params.rule, params.logicalKey)
    : undefined
  return {
    ...preparedPath(path),
    value: params.sourceValue,
    suppressOrdinaryOutput: !isTerminalPath(path),
    ...(siblingOrder === undefined ? {} : { siblingOrder }),
    ...(params.property?.propertyRule.tag === undefined ? {} : { tag: params.property.propertyRule.tag }),
    ...(params.exportClaimId === undefined ? {} : { exportClaimId: params.exportClaimId }),
  }
}

function rawSiblingOrder(
  ownerYaml: unknown,
  rule: MetadataItemRule | undefined,
  logicalKey: string,
): readonly string[] | undefined {
  if (!isRecord(ownerYaml) || rule === undefined) return undefined
  const rawPath = splitRawPath(logicalKey)
  const isCompiledAncestor = getYAMLToXMLPlan(rule).properties.some((property) =>
    rawPath.length < property.xmlPath.length
    && rawPath.every((segment, index) => property.xmlPath[index] === segment)
  )
  if (!isCompiledAncestor) return undefined
  const result: string[] = []
  for (const yamlKey of yamlMappingKeys(ownerYaml)) {
    const property = propertyForYamlKey(rule, yamlKey)
    const xmlName = property?.xmlPath[0] ?? splitRawPath(yamlKey)[0]
    if (xmlName !== undefined && !result.includes(xmlName)) result.push(xmlName)
  }
  return result.length === 0 ? undefined : result
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
  readonly exportClaimId?: string
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
  readonly sourceValue: unknown
  readonly tag?: string
  readonly exportClaimId: string
}): PreparedXmlAnomalyBoundary {
  if (params.sourceValue === undefined) {
    throw new Error("Compact !xml/raw всего item не имеет зарегистрированной property-границы")
  }
  return {
    path: "$item",
    value: params.sourceValue,
    suppressOrdinaryOutput: true,
    exportClaimId: params.exportClaimId,
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
    ...(boundary.exportClaimId === undefined ? {} : { exportClaimId: boundary.exportClaimId }),
  }
}

function nextExportClaimId(state: { nextId: number }): string {
  const id = `item-${state.nextId}`
  state.nextId += 1
  return id
}

const EXPORT_CLAIM_ATTRIBUTE = "nkdkXmlAnomalyClaim"

function resolveExportClaimBoundaries(
  xml: Record<string, unknown>,
  boundaries: readonly PreparedXmlAnomalyBoundary[],
): readonly PreparedXmlAnomalyBoundary[] {
  const claimed = boundaries.filter(({ exportClaimId }) => exportClaimId !== undefined)
  if (claimed.length === 0) return boundaries

  const probe = cloneXmlObject(xml)
  injectExportClaimAttributes(probe)
  const roots = parseXmlDocumentWithSaxes(xmlExport(probe, false), {
    preserveXsiNil: true,
    preserveEmptyElements: true,
  }).roots
  const paths = collectExportClaimPaths(roots)

  return boundaries.map((boundary) => {
    if (boundary.exportClaimId === undefined) return boundary
    const claimedPath = paths.get(boundary.exportClaimId)
    if (claimedPath === undefined) {
      throw new Error(
        `Не найден фактически экспортированный item для raw-границы ${boundary.path}`,
      )
    }
    const relative = boundary.path === "$item"
      ? []
      : boundary.path.split("\\").map((name, index) => ({
          name,
          occurrence: boundary.occurrencePath?.[index] ?? null,
        }))
    const combined = [
      ...claimedPath,
      ...relative,
    ]
    const occurrencePath = combined.map(({ occurrence }) => occurrence)
    const { exportClaimId: _claim, ...resolved } = boundary
    return {
      ...resolved,
      path: combined.map(({ name }) => name).join("\\"),
      occurrencePath,
    }
  })
}

function injectExportClaimAttributes(value: unknown, seen = new WeakSet<object>()): void {
  if (value === null || typeof value !== "object") return
  if (seen.has(value)) return
  seen.add(value)
  if (!Array.isArray(value)) {
    const attributeKey = `_${EXPORT_CLAIM_ATTRIBUTE}`
    if (Object.prototype.hasOwnProperty.call(value, attributeKey)) {
      throw new Error(`XML-атрибут ${attributeKey} занят и не может служить export claim`)
    }
    const claimId = readXmlAnomalyExportClaim(value)
    if (claimId !== undefined) {
      Object.defineProperty(value, attributeKey, {
        configurable: true,
        enumerable: true,
        value: claimId,
      })
    }
  }
  for (const key of Reflect.ownKeys(value)) {
    injectExportClaimAttributes((value as Record<PropertyKey, unknown>)[key], seen)
  }
}

interface PhysicalClaimPathSegment {
  readonly name: string
  readonly occurrence: number
}

function collectExportClaimPaths(
  roots: readonly XmlElementNode[],
): ReadonlyMap<string, readonly PhysicalClaimPathSegment[]> {
  const result = new Map<string, readonly PhysicalClaimPathSegment[]>()
  collectExportClaimPathsFromSiblings(roots, [], result, roots.length === 1)
  return result
}

function collectExportClaimPathsFromSiblings(
  siblings: readonly XmlElementNode[],
  parentPath: readonly PhysicalClaimPathSegment[],
  result: Map<string, readonly PhysicalClaimPathSegment[]>,
  omitSoleRoot = false,
): void {
  const occurrences = new Map<string, number>()
  for (const element of siblings) {
    const occurrence = (occurrences.get(element.name) ?? 0) + 1
    occurrences.set(element.name, occurrence)
    const path = omitSoleRoot
      ? parentPath
      : [...parentPath, { name: element.name, occurrence }]
    const claim = element.attributes.find(({ name }) => name === EXPORT_CLAIM_ATTRIBUTE)?.value
    if (claim !== undefined) {
      if (result.has(claim)) {
        throw new Error(`XML anomaly export claim ${claim} соответствует нескольким XML-элементам`)
      }
      result.set(claim, path)
    }
    collectExportClaimPathsFromSiblings(
      element.content.filter((node): node is XmlElementNode => node.type === "element"),
      path,
      result,
    )
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
