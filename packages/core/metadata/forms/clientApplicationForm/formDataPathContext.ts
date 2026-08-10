import type { MetadataItemRule } from "../../ruleRuntime/property/types"
import type { FormDataPathTabularElementDeclaration } from "../../ruleRuntime/dataPath/formIndex"
import { acceptFormTabularElementVisit } from "../../ruleRuntime/formElement/formTableDataPaths"
import { resolveDataPathCore } from "../../validation/dataPath/coreResolver"
import type { FormDataPathIndex } from "../../validation/dataPath/formIndex"
import type { OwnerMetadataCache } from "../../validation/dataPath/ownerCache"
import { standardMemberYamlToInternal } from "../../validation/dataPath/registry"
import { collectFormDataPathOccurrencesFromYAML } from "../../validation/dataPath/formYamlTraversal"
import type { ClientApplicationFormYAML } from "./types"
import { createFormDataPathIndexFromYAML } from "./formDataPathMetadata"
import { resolveClientApplicationFormCollectionItemRule } from "./formDataPathProjection"
import { ClientApplicationFormRules } from "./rules"

export interface FormElementDataPathState {
  readonly name: string
  readonly yamlPath: readonly (string | number)[]
  readonly origin: "own" | "borrowed"
  readonly present: boolean
  readonly value: unknown
  readonly tableOwnerName?: string
  readonly candidateYaml?: string
  readonly candidateInternal?: string
  readonly currentConfigurationValue?: string
}

export interface FormDataPathContext {
  readonly index: FormDataPathIndex
  readonly elementsByName: ReadonlyMap<string, FormElementDataPathState>
  readonly effectiveMainAttribute?: string
}

export function prepareFormDataPathContextFromYAML(params: {
  readonly yaml: ClientApplicationFormYAML
  readonly currentConfigurationFormYaml?: ClientApplicationFormYAML
  readonly savedBaseFormYaml?: ClientApplicationFormYAML
  readonly ownerCache: OwnerMetadataCache
  readonly rule?: MetadataItemRule
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
  const collected = collectFormElements(params.yaml, rule)
  const ownIndex = createFormDataPathIndexFromYAML(params.yaml, collected.tabularElementsByName)
  const index = mergeFormDataPathIndexes(ownIndex, currentConfigurationForm?.index)
  const effectiveMainAttribute =
    findMainAttribute(params.yaml) ?? currentConfigurationForm?.effectiveMainAttribute
  const prepared = prepareCollectedForm({
    collected,
    index,
    ownerCache: params.ownerCache,
    effectiveMainAttribute,
    borrowedNames,
    currentConfigurationForm,
  })

  return {
    index,
    elementsByName: prepared.elementsByName,
    ...(effectiveMainAttribute === undefined ? {} : { effectiveMainAttribute }),
  }
}

interface CollectedFormElement {
  readonly name: string
  readonly itemType: string
  readonly yamlPath: readonly (string | number)[]
  readonly present: boolean
  readonly value: unknown
  readonly tableOwnerName?: string
}

interface CollectedForm {
  readonly elementsByName: ReadonlyMap<string, CollectedFormElement>
  readonly tabularElementsByName: ReadonlyMap<string, FormDataPathTabularElementDeclaration>
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
    effectiveMainAttribute: findMainAttribute(params.yaml),
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
        const columnName = columnNameFromElement(collected.name, collected.tableOwnerName)
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
    const currentConfigurationValue = params.currentConfigurationForm?.effectivePath(name)?.yaml
    elementsByName.set(name, {
      name,
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

function collectFormElements(yaml: ClientApplicationFormYAML, rule: MetadataItemRule): CollectedForm {
  const elementsByName = new Map<string, CollectedFormElement>()
  const tabularElementsByName = new Map<string, FormDataPathTabularElementDeclaration>()
  collectFormDataPathOccurrencesFromYAML({
    yaml,
    rule,
    resolveCollectionItemRule: resolveClientApplicationFormCollectionItemRule,
    visitElement: (visit) => {
      const dataPath = visit.primaryDataPath
      elementsByName.set(visit.name, {
        name: visit.name,
        itemType: visit.itemType,
        yamlPath: visit.yamlPath,
        present: dataPath?.present ?? false,
        value: dataPath?.value,
        ...(visit.tableOwner === undefined ? {} : { tableOwnerName: visit.tableOwner.name }),
      })
      acceptFormTabularElementVisit(tabularElementsByName, visit)
    },
  })
  return { elementsByName, tabularElementsByName }
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

function findMainAttribute(yaml: ClientApplicationFormYAML): string | undefined {
  const attributes = asRecord(yaml)?.["Реквизиты"]
  for (const [name, value] of Object.entries(asRecord(attributes) ?? {})) {
    const mainAttribute = asRecord(value)?.["ОсновнойРеквизит"]
    if (mainAttribute === true || mainAttribute === "Истина") return name
  }
  return undefined
}

function columnNameFromElement(elementName: string, tableName: string): string {
  return elementName.startsWith(tableName) && elementName.length > tableName.length
    ? elementName.slice(tableName.length)
    : elementName
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
