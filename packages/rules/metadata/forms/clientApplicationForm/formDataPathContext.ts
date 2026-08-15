import type { DataPathPropertyRule, MetadataItemRule } from "@nkdk/runtime/rule-kit"
import { copyYAMLScalarTags } from "@nkdk/runtime"
import type { ElementType } from "../../ruleRuntime/formElement/types"
import type { FormDataPathTabularElementDeclaration } from "@nkdk/runtime/rule-kit"
import { acceptFormTabularElementVisit } from "../../ruleRuntime/formElement/formTableDataPaths"
import { resolveDataPathCore } from "../../validation/dataPath/coreResolver"
import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { standardMemberYamlToInternal } from "../../validation/dataPath/registry"
import {
  collectFormDataPathOccurrencesFromYAML,
  type FormYAMLItemVisitor,
} from "../../validation/dataPath/formYamlTraversal"
import type { ClientApplicationFormYAML } from "./types"
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"
import { resolveClientApplicationFormCollectionItemRule } from "./formDataPathProjection"
import { ClientApplicationFormRules } from "./rules"
import { findMainAttributeName } from "./mainAttributeKinds"

export interface FormElementDataPathState {
  readonly name: string
  readonly elementType?: ElementType
  readonly dataPathRule: DataPathPropertyRule
  readonly yamlPath: readonly (string | number)[]
  readonly origin: "own" | "borrowed"
  readonly present: boolean
  readonly value: unknown
  readonly tableOwnerName?: string
  readonly candidateYaml?: string
  readonly candidateInternal?: string
  readonly valueInternal?: string
  readonly currentConfigurationValue?: string
}

export interface FormDataPathContext {
  readonly index: FormDataPathIndex
  readonly elementsByName: ReadonlyMap<string, FormElementDataPathState>
  readonly effectiveMainAttribute?: string
}

export interface ClientApplicationFormDataPathPreparation {
  readonly collected: CollectedForm
  readonly index: FormDataPathIndex
  readonly effectiveMainAttribute?: string
}

export function collectClientApplicationFormDataPathPreparation(params: {
  yaml: ClientApplicationFormYAML
  rule?: MetadataItemRule
  visitItem?: FormYAMLItemVisitor
}): ClientApplicationFormDataPathPreparation {
  const rule = params.rule ?? ClientApplicationFormRules
  const collected = collectFormElements(params.yaml, rule, params.visitItem)
  const effectiveMainAttribute = findMainAttributeName(asRecord(params.yaml)?.["Реквизиты"])
  return {
    collected,
    index: createFormDataPathIndexFromYAML(params.yaml, collected.tabularElementsByName),
    ...(effectiveMainAttribute === undefined ? {} : { effectiveMainAttribute }),
  }
}

export function compactImportedFormDataPaths(params: {
  readonly yaml: ClientApplicationFormYAML
  readonly context: FormDataPathContext
}): void {
  for (const element of params.context.elementsByName.values()) {
    if (element.origin !== "own" || element.candidateInternal === undefined) continue
    const yaml = recordAtPath(params.yaml, element.yamlPath)
    if (!element.present) {
      yaml["ПутьКДанным"] = ""
    } else if (element.valueInternal === element.candidateInternal) {
      delete yaml["ПутьКДанным"]
    }
  }
}

export function requiresImportedFormDataPathCompaction(
  yaml: ClientApplicationFormYAML,
  rule: MetadataItemRule = ClientApplicationFormRules
): boolean {
  const mainAttribute = findMainAttributeName(asRecord(yaml)?.["Реквизиты"])
  if (mainAttribute === undefined) return false
  const collected = collectFormElements(yaml, rule)
  const effectivePaths = new Map<string, string | undefined>()

  const candidate = (element: CollectedFormElement): string | undefined => {
    if (element.itemType !== "Table" && element.tableOwnerName !== undefined) {
      const table = collected.elementsByName.get(element.tableOwnerName)
      const tablePath = table === undefined ? undefined : effectivePath(table)
      return tablePath === undefined ? undefined : `${tablePath}.${semanticElementName(element)}`
    }
    return `${mainAttribute}.${element.name}`
  }
  const effectivePath = (element: CollectedFormElement): string | undefined => {
    if (effectivePaths.has(element.name)) return effectivePaths.get(element.name)
    const value = element.present && typeof element.value === "string" && element.value.trim().length > 0
      ? element.value
      : candidate(element)
    effectivePaths.set(element.name, value)
    return value
  }

  for (const element of collected.elementsByName.values()) {
    const candidateYaml = candidate(element)
    if (candidateYaml === undefined) continue
    if (!element.present || element.value === "") return true
    if (typeof element.value !== "string") continue
    const semanticName = semanticElementName(element)
    const internalName = standardMemberYamlToInternal(semanticName)
    const candidateInternal = internalName === undefined
      ? candidateYaml
      : replaceUnconvertedLeaf(candidateYaml, semanticName, internalName)
    if (element.value === candidateYaml || element.value === candidateInternal) return true
  }
  return false
}

export function materializeImplicitFormDataPaths(
  yaml: ClientApplicationFormYAML,
  context: FormDataPathContext
): ClientApplicationFormYAML {
  const changes: MaterializedDataPathChange[] = []
  for (const element of context.elementsByName.values()) {
    if (element.origin !== "own") continue
    if (element.present) {
      if (element.value === "") {
        changes.push({ yamlPath: element.yamlPath, kind: "delete" })
      }
      continue
    }
    if (element.candidateYaml !== undefined) {
      changes.push({ yamlPath: element.yamlPath, kind: "set", value: element.candidateYaml })
    }
  }
  if (changes.length === 0) return yaml

  const root = cloneContainer(yaml)
  const clones = new Map<object, object>([[yaml, root]])
  for (const change of changes) {
    const element = mutableRecordAtPath({ source: yaml, target: root, path: change.yamlPath, clones })
    if (change.kind === "delete") delete element["ПутьКДанным"]
    else element["ПутьКДанным"] = change.value
  }
  return root as ClientApplicationFormYAML
}

type MaterializedDataPathChange =
  | { readonly yamlPath: readonly (string | number)[]; readonly kind: "delete" }
  | { readonly yamlPath: readonly (string | number)[]; readonly kind: "set"; readonly value: string }

export function prepareFormDataPathContextFromYAML(params: {
  readonly yaml: ClientApplicationFormYAML
  readonly currentConfigurationFormYaml?: ClientApplicationFormYAML
  readonly savedBaseFormYaml?: ClientApplicationFormYAML
  readonly ownerCache: OwnerMetadataCache
  readonly rule?: MetadataItemRule
  readonly preparation?: ClientApplicationFormDataPathPreparation
}): FormDataPathContext {
  const rule = params.rule ?? ClientApplicationFormRules
  const currentConfigurationForm =
    params.currentConfigurationFormYaml === undefined
      ? undefined
      : prepareStandaloneForm({
          yaml: params.currentConfigurationFormYaml,
          ownerCache: params.ownerCache,
          rule,
        })
  const borrowedNames = new Set(currentConfigurationForm?.elementsByName.keys() ?? [])
  if (params.savedBaseFormYaml !== undefined) {
    collectFormElements(params.savedBaseFormYaml, rule).elementsByName.forEach((_value, name) => borrowedNames.add(name))
  }
  const preparation = params.preparation ?? collectClientApplicationFormDataPathPreparation({
    yaml: params.yaml,
    rule,
  })
  const collected = preparation.collected
  const ownIndex = preparation.index
  const index = mergeFormDataPathIndexes(ownIndex, currentConfigurationForm?.index)
  const effectiveMainAttribute =
    preparation.effectiveMainAttribute ?? currentConfigurationForm?.effectiveMainAttribute
  const prepared = prepareCollectedForm({
    collected,
    index,
    ownerCache: params.ownerCache,
    effectiveMainAttribute,
    borrowedNames,
    currentConfigurationForm,
  })
  const effectiveIndex = withEffectiveTabularElementDataPaths({
    index,
    collected,
    prepared,
  })

  return {
    index: effectiveIndex,
    elementsByName: prepared.elementsByName,
    ...(effectiveMainAttribute === undefined ? {} : { effectiveMainAttribute }),
  }
}

function withEffectiveTabularElementDataPaths(params: {
  index: FormDataPathIndex
  collected: CollectedForm
  prepared: PreparedForm
}): FormDataPathIndex {
  const tabularElementsByName = new Map(params.index.tabularElementsByName)
  for (const [name, element] of params.collected.elementsByName) {
    if (element.itemType !== "Table" || !tabularElementsByName.has(name)) continue
    if (element.present && typeof element.value === "string" && element.value.trim().length > 0) continue
    const dataPath = params.prepared.effectivePath(name)?.yaml
    tabularElementsByName.set(name, {
      kind: "tabularFormElement",
      ...(dataPath === undefined ? {} : { dataPath }),
    })
  }
  return { ...params.index, tabularElementsByName }
}

export interface CollectedFormElement {
  readonly name: string
  readonly itemType: string
  readonly dataPathRule: DataPathPropertyRule
  readonly yamlPath: readonly (string | number)[]
  readonly present: boolean
  readonly value: unknown
  readonly tableOwnerName?: string
}

export interface CollectedForm {
  readonly elementsByName: ReadonlyMap<string, CollectedFormElement>
  readonly tabularElementsByName: ReadonlyMap<string, FormDataPathTabularElementDeclaration>
  readonly occurrences: ReturnType<typeof collectFormDataPathOccurrencesFromYAML>
}

interface ResolvedPath {
  readonly yaml: string
  readonly internal: string
}

interface PreparedForm {
  readonly index: FormDataPathIndex
  readonly elementsByName: ReadonlyMap<string, FormElementDataPathState>
  readonly effectiveMainAttribute?: string
  effectivePath(name: string): ResolvedPath | undefined
}

interface PendingElement {
  readonly collected: CollectedFormElement
  readonly origin: "own" | "borrowed"
  candidateState: "unresolved" | "resolving" | "resolved"
  candidate?: ResolvedPath
  effectiveState: "unresolved" | "resolving" | "resolved"
  effective?: ResolvedPath
}

function prepareStandaloneForm(params: {
  yaml: ClientApplicationFormYAML
  ownerCache: OwnerMetadataCache
  rule: MetadataItemRule
}): PreparedForm {
  const collected = collectFormElements(params.yaml, params.rule)
  const index = createFormDataPathIndexFromYAML(params.yaml, collected.tabularElementsByName)
  return prepareCollectedForm({
    collected,
    index,
    ownerCache: params.ownerCache,
    effectiveMainAttribute: findMainAttributeName(asRecord(params.yaml)?.["Реквизиты"]),
    borrowedNames: new Set(),
  })
}

function prepareCollectedForm(params: {
  collected: CollectedForm
  index: FormDataPathIndex
  ownerCache: OwnerMetadataCache
  effectiveMainAttribute?: string
  borrowedNames: ReadonlySet<string>
  currentConfigurationForm?: PreparedForm
}): PreparedForm {
  const pending = new Map<string, PendingElement>()
  for (const [name, collected] of params.collected.elementsByName) {
    pending.set(name, {
      collected,
      origin: params.borrowedNames.has(name) ? "borrowed" : "own",
      candidateState: "unresolved",
      effectiveState: "unresolved",
    })
  }

  const resolvePath = (yaml: string, semanticLeafName?: string): ResolvedPath | undefined => {
    const resolved = resolveDataPathCore({
      value: yaml,
      nameMode: "yaml",
      index: params.index,
      ownerCache: params.ownerCache,
    })
    if (resolved.status !== "ok" || resolved.target === undefined || resolved.internalValue === undefined) {
      return undefined
    }
    if (semanticLeafName === undefined) return { yaml, internal: resolved.internalValue }
    const standardInternalName = standardMemberYamlToInternal(semanticLeafName)
    return {
      yaml,
      internal:
        standardInternalName === undefined
          ? resolved.internalValue
          : replaceUnconvertedLeaf(resolved.internalValue, semanticLeafName, standardInternalName),
    }
  }

  const candidate = (element: PendingElement): ResolvedPath | undefined => {
    if (element.candidateState === "resolved") return element.candidate
    if (element.candidateState === "resolving") return undefined
    element.candidateState = "resolving"
    const { collected } = element
    let candidateYaml: string | undefined
    let semanticLeafName: string | undefined
    if (collected.itemType !== "Table" && collected.tableOwnerName !== undefined) {
      const table = pending.get(collected.tableOwnerName)
      const tablePath = table === undefined ? undefined : effectivePath(table)
      if (tablePath !== undefined) {
        const columnName = semanticElementName(collected)
        candidateYaml = `${tablePath.yaml}.${columnName}`
        semanticLeafName = columnName
      }
    } else if (params.effectiveMainAttribute !== undefined) {
      candidateYaml = `${params.effectiveMainAttribute}.${collected.name}`
      semanticLeafName = collected.name
    }
    element.candidate =
      candidateYaml === undefined ? undefined : resolvePath(candidateYaml, semanticLeafName)
    element.candidateState = "resolved"
    return element.candidate
  }

  const effectivePath = (element: PendingElement): ResolvedPath | undefined => {
    if (element.effectiveState === "resolved") return element.effective
    if (element.effectiveState === "resolving") return undefined
    element.effectiveState = "resolving"
    const explicit = element.collected.value
    if (element.collected.present) {
      element.effective =
        typeof explicit === "string" && explicit.trim().length > 0 ? resolvePath(explicit) : undefined
    } else if (element.origin === "borrowed") {
      element.effective = params.currentConfigurationForm?.effectivePath(element.collected.name)
    } else {
      element.effective = candidate(element)
    }
    element.effectiveState = "resolved"
    return element.effective
  }

  const elementsByName = new Map<string, FormElementDataPathState>()
  for (const [name, element] of pending) {
    const resolvedCandidate = candidate(element)
    const valueInternal =
      element.collected.present &&
      typeof element.collected.value === "string" &&
      element.collected.value.trim().length > 0
        ? resolvePath(element.collected.value, semanticElementName(element.collected))?.internal
        : undefined
    const currentConfigurationValue = params.currentConfigurationForm?.effectivePath(name)?.yaml
    elementsByName.set(name, {
      name,
      ...(isElementType(element.collected.itemType) ? { elementType: element.collected.itemType } : {}),
      dataPathRule: element.collected.dataPathRule,
      yamlPath: element.collected.yamlPath,
      origin: element.origin,
      present: element.collected.present,
      value: element.collected.value,
      ...(element.collected.tableOwnerName === undefined
        ? {}
        : { tableOwnerName: element.collected.tableOwnerName }),
      ...(resolvedCandidate === undefined
        ? {}
        : { candidateYaml: resolvedCandidate.yaml, candidateInternal: resolvedCandidate.internal }),
      ...(valueInternal === undefined ? {} : { valueInternal }),
      ...(currentConfigurationValue === undefined ? {} : { currentConfigurationValue }),
    })
  }

  return {
    index: params.index,
    elementsByName,
    ...(params.effectiveMainAttribute === undefined
      ? {}
      : { effectiveMainAttribute: params.effectiveMainAttribute }),
    effectivePath(name) {
      const element = pending.get(name)
      return element === undefined ? undefined : effectivePath(element)
    },
  }
}

function collectFormElements(
  yaml: ClientApplicationFormYAML,
  rule: MetadataItemRule,
  visitItem?: FormYAMLItemVisitor
): CollectedForm {
  const elementsByName = new Map<string, CollectedFormElement>()
  const tabularElementsByName = new Map<string, FormDataPathTabularElementDeclaration>()
  const occurrences = collectFormDataPathOccurrencesFromYAML({
    yaml,
    rule,
    visitItem,
    resolveCollectionItemRule: resolveClientApplicationFormCollectionItemRule,
    visitElement: (visit) => {
      acceptFormTabularElementVisit(tabularElementsByName, visit)
      const dataPath = visit.primaryDataPath
      if (dataPath === undefined) return
      const dataPathRule = Object.values(visit.rule.properties).find(
        (propertyRule): propertyRule is DataPathPropertyRule =>
          propertyRule.type === "DataPath" && propertyRule.yaml === dataPath.yamlKey
      )
      if (dataPathRule === undefined) return
      elementsByName.set(visit.name, {
        name: visit.name,
        itemType: visit.itemType,
        dataPathRule,
        yamlPath: visit.yamlPath,
        present: dataPath?.present ?? false,
        value: dataPath?.value,
        ...(visit.tableOwner === undefined ? {} : { tableOwnerName: visit.tableOwner.name }),
      })
    },
  })
  return { elementsByName, tabularElementsByName, occurrences }
}

function mergeFormDataPathIndexes(
  primary: FormDataPathIndex,
  fallback: FormDataPathIndex | undefined
): FormDataPathIndex {
  if (fallback === undefined) return primary
  const roots = new Map(fallback.roots)
  for (const [name, value] of primary.roots) roots.set(name, value)
  const additionalColumnsByTablePath = new Map(fallback.additionalColumnsByTablePath)
  for (const [path, columns] of primary.additionalColumnsByTablePath) {
    additionalColumnsByTablePath.set(path, columns)
  }
  const tabularElementsByName = new Map(fallback.tabularElementsByName)
  for (const [name, value] of primary.tabularElementsByName) tabularElementsByName.set(name, value)
  return {
    ...primary,
    roots,
    additionalColumnsByTablePath,
    tabularElementsByName,
    getRoot: (name) => roots.get(name),
  }
}

function semanticElementName(element: CollectedFormElement): string {
  const tableName = element.tableOwnerName
  return tableName !== undefined && element.name.startsWith(tableName) && element.name.length > tableName.length
    ? element.name.slice(tableName.length)
    : element.name
}

function replaceUnconvertedLeaf(value: string, yamlName: string, internalName: string): string {
  const segments = value.split(".")
  if (segments.at(-1) !== yamlName) return value
  segments[segments.length - 1] = internalName
  return segments.join(".")
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

function recordAtPath(value: unknown, path: readonly (string | number)[]): Record<string, unknown> {
  let current = value
  for (const segment of path) {
    if (!isContainer(current)) throw new Error(`Некорректный YAML-путь элемента формы: ${path.join(".")}`)
    current = current[segment as keyof typeof current]
  }
  const record = asRecord(current)
  if (record !== undefined) return record
  throw new Error(`YAML-путь элемента формы не указывает на объект: ${path.join(".")}`)
}

function mutableRecordAtPath(params: {
  source: unknown
  target: unknown
  path: readonly (string | number)[]
  clones: Map<object, object>
}): Record<string, unknown> {
  let source = params.source
  let target = params.target
  for (const segment of params.path) {
    if (!isContainer(source) || !isContainer(target)) {
      throw new Error(`Некорректный YAML-путь элемента формы: ${params.path.join(".")}`)
    }
    const sourceChild = source[segment as keyof typeof source]
    if (!isContainer(sourceChild)) {
      throw new Error(`Некорректный YAML-путь элемента формы: ${params.path.join(".")}`)
    }
    let targetChild = params.clones.get(sourceChild)
    if (targetChild === undefined) {
      targetChild = cloneContainer(sourceChild)
      params.clones.set(sourceChild, targetChild)
      target[segment as keyof typeof target] = targetChild as never
    }
    source = sourceChild
    target = targetChild
  }
  const record = asRecord(target)
  if (record !== undefined) return record
  throw new Error(`YAML-путь элемента формы указывает на массив: ${params.path.join(".")}`)
}

function cloneContainer<T extends object>(value: T): T {
  const clone = (Array.isArray(value) ? [...value] : { ...value }) as T
  copyYAMLScalarTags(value, clone)
  return clone
}

function isContainer(value: unknown): value is Record<string | number, unknown> | unknown[] {
  return value !== null && typeof value === "object"
}

function isElementType(value: string): value is ElementType {
  return value !== "ClientApplicationForm" && !value.startsWith("Metadata")
}
