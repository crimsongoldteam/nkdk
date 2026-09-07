import { parseMetadataTargetFromModel, parseMetadataTargetFromYAML } from "../ruleRuntime/metadataTarget"
import { rootFromYAML } from "@nkdk/runtime/rule-kit"
import type {
  LocalMetadataEvent,
  MetadataFieldKind,
  MetadataItemRule,
  ParsedMetadataTarget,
  PropertyRule,
} from "@nkdk/runtime/rule-kit"
import { getTypeRule } from "../ruleRuntime/property/typeRuleRegistry"
import type { OwnerMetadata } from "../validation/dataPath/ownerCache"
import type { ObjectField, ObjectFieldKind } from "../validation/dataPath/objectFields"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import {
  addressableMetadataItemLogicalAddress,
  collectAddressableMetadataLogicalAddresses,
  collectAddressableMetadataObjectEntries,
  objectTargetForProjectFile,
} from "../validation/addressableMetadataTargets"
import { getProjectReferenceMemberIndexContributors } from "../validation/projectReferenceIndexRegistry"
import {
  projectMemberIndexKey,
  projectMetadataTargetIndexKey,
  projectObjectIndexKey,
  type PendingMetadataTargetReference,
  type ProjectMemberIndexEntry,
  type ProjectObjectIndexEntry,
} from "../validation/projectReferenceIndex"
import type { ValidationProjectFile } from "../validation/projectFiles"
import type { ValidationIndexContribution, ValidationObjectRecord } from "../validation/projectValidationTypes"
import type { ProjectLocalDependency, ProjectLogicalAddressEntry } from "../projectDefinition/componentIndexFacts"
import type { PreparedImportYaml } from "./prepareYaml"
import type { PreparedImportFacts } from "./prepareFacts"
import { extractImportOwnerFacts } from "./ownerFacts"
import { selectImportPropertyValues } from "./selectedPropertyFacts"
import { ImportPropertyValues } from "./propertyValues"

export interface ImportValidationContribution {
  validationContribution: ValidationIndexContribution
  localDependencies: ProjectLocalDependency[]
}

export type ImportValidationContributionProfileStep =
  | "Сбор ссылок и локальных зависимостей"
  | "Сбор сведений о владельцах и полях"
  | "Сбор объектов общего индекса"
  | "Сбор полей общего индекса"
  | "Формирование записей объектов общего индекса"
  | "Сбор логических адресов"

export interface ImportValidationContributionMeasure {
  <T>(step: ImportValidationContributionProfileStep, action: () => T): T
}

export function extractImportValidationContribution(params: {
  prepared: PreparedImportYaml
  projectDir: string
  file: ValidationProjectFile
  measure?: ImportValidationContributionMeasure
}): ImportValidationContribution {
  return extractImportValidationContributionCore({
    ...params,
    rawYaml: params.prepared.yaml,
    readProperty: (key) => metadataRecord(params.prepared.yaml)[key],
  })
}

export function extractImportValidationContributionFromFacts(params: {
  prepared: PreparedImportFacts
  projectDir: string
  file: ValidationProjectFile
  measure?: ImportValidationContributionMeasure
}): ImportValidationContribution {
  const values = params.file.kind === "form" ? new Map<string, unknown>() : selectImportPropertyValues(
    params.prepared.semanticFacts,
    new Set(["Тип", ...getProjectReferenceMemberIndexContributors().flatMap(({ yamlProperties }) => yamlProperties)]),
  )
  return extractImportValidationContributionCore({
    ...params,
    rawYaml: undefined,
    readProperty: (key) => values.get(key),
  })
}

function extractImportValidationContributionCore(params: {
  prepared: PreparedImportYaml | PreparedImportFacts
  projectDir: string
  file: ValidationProjectFile
  rawYaml: unknown
  readProperty: (yamlKey: string) => unknown
  measure?: ImportValidationContributionMeasure
}): ImportValidationContribution {
  const measure: ImportValidationContributionMeasure = params.measure ?? ((_step, action) => action())
  const file = params.file

  const { localDependencies, pendingReferences } = measure("Сбор ссылок и локальных зависимостей", () => {
    const references = extractMetadataTargetReferences(params.prepared)
    return {
      localDependencies: references.map(({ reference, rulePath }) => ({
        sourceProjectPath: params.prepared.assignment.targetProjectPath,
        yamlPath: [...reference.yamlPath],
        rulePath: rulePath.map((segment) => ({ ...segment })),
        kind: "metadataTarget" as const,
        canonical: reference.canonical,
      })),
      pendingReferences: [
        ...references.map(({ reference }) => reference),
        ...(isPreparedImportFacts(params.prepared) ? params.prepared.pendingReferences : []),
      ],
    }
  })

  if (file.kind === "form") {
    const memberIndexEntries = measure("Сбор полей общего индекса", () => formMemberIndexEntries(file))
    return {
      localDependencies,
      validationContribution: {
        objectRecords: [],
        objectIndexEntries: [],
        memberIndexEntries,
        valueIndexEntries: [],
        pendingReferences,
        localDependencies: [],
        logicalAddresses: [],
      },
    }
  }

  const objectIndexEntries = measure(
    "Сбор объектов общего индекса",
    () => objectIndexEntriesForFile(file, params.rawYaml, params.prepared, params.readProperty),
  )
  const ownerFacts = measure(
    "Сбор сведений о владельцах и полях",
    () => extractImportOwnerFacts(params.prepared, objectIndexEntries[0]?.target, params.rawYaml),
  )
  const memberIndexEntries = measure(
    "Сбор полей общего индекса",
    () => mergeMemberIndexEntries([
      ...ownerFacts.flatMap((facts) => ownerMemberIndexEntries({
        projectDir: params.projectDir,
        file,
        prepared: params.prepared,
        readProperty: params.readProperty,
        facts,
      })),
      ...rawYamlMemberIndexEntries({
        projectDir: params.projectDir,
        file,
        prepared: params.prepared,
        readProperty: params.readProperty,
      }),
    ]),
  )
  const objectRecords = measure(
    "Формирование записей объектов общего индекса",
    () => ownerFacts.map((facts) =>
      ownerRecord({
        file,
        facts,
        objectIndexEntries,
        memberIndexEntries,
        pendingReferences,
      })
    ),
  )
  const canonicalTarget = objectIndexEntries[0]?.canonical
  const logicalAddresses = measure(
    "Сбор логических адресов",
    () => canonicalTarget === undefined
      ? []
      : isPreparedImportFacts(params.prepared)
      ? collectLogicalAddressesFromFacts(params.prepared, params.file.projectPath)
      : collectAddressableMetadataLogicalAddresses({
          yaml: params.rawYaml,
          rule: file.itemRule,
          logicalAddress: params.prepared.assignment.logicalAddress,
          filePath: params.prepared.assignment.targetProjectPath,
        }),
  )

  return {
    localDependencies,
    validationContribution: {
      objectRecords,
      objectIndexEntries,
      memberIndexEntries,
      valueIndexEntries: [],
      pendingReferences,
      localDependencies: [],
      logicalAddresses,
    },
  }
}

export function mergeImportValidationContributions(
  contributions: readonly ImportValidationContribution[]
): ImportValidationContribution {
  return {
    localDependencies: contributions.flatMap((item) => item.localDependencies),
    validationContribution: {
      objectRecords: contributions.flatMap((item) => item.validationContribution.objectRecords),
      objectIndexEntries: contributions.flatMap((item) => item.validationContribution.objectIndexEntries),
      memberIndexEntries: contributions.flatMap((item) => item.validationContribution.memberIndexEntries),
      valueIndexEntries: contributions.flatMap((item) => item.validationContribution.valueIndexEntries),
      pendingReferences: contributions.flatMap((item) => item.validationContribution.pendingReferences),
      localDependencies: contributions.flatMap((item) => item.validationContribution.localDependencies),
      logicalAddresses: contributions.flatMap((item) => item.validationContribution.logicalAddresses),
    },
  }
}

export function emptyImportValidationContribution(): ImportValidationContribution {
  return {
    localDependencies: [],
    validationContribution: {
      objectRecords: [],
      objectIndexEntries: [],
      memberIndexEntries: [],
      valueIndexEntries: [],
      pendingReferences: [],
      localDependencies: [],
      logicalAddresses: [],
    },
  }
}

function extractMetadataTargetReferences(prepared: PreparedImportYaml | PreparedImportFacts): Array<{
  reference: PendingMetadataTargetReference
  rulePath: ProjectLocalDependency["rulePath"]
}> {
  return (prepared.localIndexes.metadata.metadataTargets ?? []).flatMap((fact) => {
    if (isTranslateOnlyConstraint(fact.constraint)) return []
    const parsed = parseMetadataTargetFromYAML({
      value: fact.value,
      constraint: fact.constraint,
      owner: fact.owner,
    })
    if (!parsed.ok) return []

    const reference: PendingMetadataTargetReference = {
      filePath: prepared.assignment.targetProjectPath,
      yamlPath: [...fact.yamlPath],
      canonical: targetKey(parsed.target),
      target: parsed.target,
      constraint: fact.constraint,
    }
    return [{ reference, rulePath: fact.rulePath }]
  })
}

function isTranslateOnlyConstraint(constraint: PendingMetadataTargetReference["constraint"]): boolean {
  return (constraint.kind === "dataTable" || constraint.kind === "dataTableField")
    && constraint.validation === "translateOnly"
}

const targetKey = projectMetadataTargetIndexKey

function objectIndexEntriesForFile(
  file: ValidationProjectFile,
  yaml: unknown,
  prepared: PreparedImportYaml | PreparedImportFacts,
  readProperty: (yamlKey: string) => unknown,
): ProjectObjectIndexEntry[] {
  const target = objectTargetForFile(file)
  if (target === undefined) return []
  const type = readProperty("Тип")

  return [
    {
      canonical: projectObjectIndexKey(target),
      target,
      result: {
        ok: true,
        filePath: file.projectPath,
        details: typeof type === "string" ? { type } : {},
      },
    },
    ...(isPreparedImportFacts(prepared)
      ? collectAddressableObjectEntriesFromFacts(prepared, projectObjectIndexKey(target), file.projectPath)
      : collectAddressableMetadataObjectEntries({
          yaml,
          rule: file.itemRule,
          canonicalTarget: projectObjectIndexKey(target),
          filePath: file.projectPath,
        })),
  ]
}

function collectLogicalAddressesFromFacts(prepared: PreparedImportFacts, filePath: string): ProjectLogicalAddressEntry[] {
  const addressesByPath = new ImportPropertyValues<{ value: string }>()
  const entries: { entry: ProjectLogicalAddressEntry; order: readonly number[] }[] = []
  const itemPositions = new ImportPropertyValues<{ value: number }>()
  const propertyPositions = new Map<MetadataItemRule, ReadonlyMap<string, number>>()
  for (const event of prepared.localIndexes.metadata.events) {
    if (event.kind !== "item" || event.name === undefined) continue
    const resolved = resolveFactItemRule(prepared.rule, event)
    if (resolved === undefined) continue
    const logicalAddress = addressableMetadataItemLogicalAddress({
      rule: resolved.itemRule,
      propertyRule: resolved.propertyRule,
      collectionUidSegment: resolved.collectionUidSegment,
      itemName: event.name,
      parent: addressesByPath.nearestParent(event.yamlPath, "address")?.value ?? prepared.assignment.logicalAddress,
    })
    if (logicalAddress === undefined) continue
    addressesByPath.set(event.yamlPath, "address", { value: logicalAddress })
    const order: number[] = []
    let yamlOffset = 0
    for (const step of resolved.steps) {
      let positions = propertyPositions.get(step.ownerRule)
      if (positions === undefined) {
        positions = new Map(Object.keys(step.ownerRule.properties).map((key, index) => [key, index]))
        propertyPositions.set(step.ownerRule, positions)
      }
      order.push(positions.get(step.propertyKey)!)
      if (step.propertyRule.yamlInline !== true) yamlOffset += 1
      if (step.collection) {
        yamlOffset += 1
        const path = event.yamlPath.slice(0, yamlOffset)
        let position = itemPositions.get(path, "position")?.value
        if (position === undefined) {
          position = itemPositions.size
          itemPositions.set(path, "position", { value: position })
        }
        order.push(position)
      }
    }
    entries.push({ entry: { logicalAddress, sourceProjectPath: filePath }, order })
  }
  entries.sort((left, right) => {
    for (let index = 0; index < Math.min(left.order.length, right.order.length); index++) {
      const difference = left.order[index]! - right.order[index]!
      if (difference !== 0) return difference
    }
    return left.order.length - right.order.length
  })
  return entries.map(({ entry }) => entry)
}

function collectAddressableObjectEntriesFromFacts(
  prepared: PreparedImportFacts,
  canonicalTarget: string,
  filePath: string,
): ProjectObjectIndexEntry[] {
  const targetsByYamlPath = new ImportPropertyValues<{ value: string }>()
  const entries: ProjectObjectIndexEntry[] = []
  for (const event of prepared.localIndexes.metadata.events) {
    if (event.kind !== "item" || event.name === undefined) continue
    const resolved = resolveFactItemRule(prepared.rule, event)
    const external = resolved?.itemRule.externalMetadata
    if (external?.placement !== "ownedEntry") continue
    const parent = targetsByYamlPath.nearestParent(event.yamlPath, "target")?.value ?? canonicalTarget
    const canonical = `${parent}.${external.segment}.${event.name}`
    const parsed = parseMetadataTargetFromModel({
      canonical,
      constraint: { kind: "object", allowNested: true },
    })
    if (!parsed.ok || parsed.target.kind !== "object") {
      throw new Error(`Некорректный адресуемый metadata target: ${canonical}`)
    }
    targetsByYamlPath.set(event.yamlPath, "target", { value: canonical })
    entries.push({
      canonical: projectObjectIndexKey(parsed.target),
      target: parsed.target,
      result: { ok: true, filePath, details: {} },
    })
  }
  return entries
}

function resolveFactItemRule(
  rootRule: MetadataItemRule,
  event: Extract<LocalMetadataEvent, { kind: "item" }>,
): {
  readonly itemRule: MetadataItemRule
  readonly propertyRule: PropertyRule
  readonly collectionUidSegment?: string
  readonly steps: readonly FactRuleStep[]
} | undefined {
  let currentRule = rootRule
  let lastProperty: PropertyRule | undefined
  let lastCollectionUidSegment: string | undefined
  const steps: FactRuleStep[] = []
  for (const segment of event.rulePath) {
    const propertyRule = currentRule.properties[segment.propertyKey]
    if (propertyRule === undefined) return undefined
    const nested = getTypeRule(propertyRule.type, "nestedItemRule")
    const yamlNested = getTypeRule(propertyRule.type, "yamlToXMLNestedRule")
    const nestedItemType = segment.nestedItemType ?? event.itemType
    const itemRule = nested === undefined
      ? undefined
      : "itemRule" in nested
        ? nested.itemRule
        : nested.resolveItemRule(nestedItemType)
    if (itemRule === undefined) continue
    steps.push({
      propertyRule,
      propertyKey: segment.propertyKey,
      ownerRule: currentRule,
      collection: yamlNested?.kind === "collection",
    })
    lastProperty = propertyRule
    lastCollectionUidSegment = currentRule.childCollections
      ?.find(({ propertyKey }) => propertyKey === segment.propertyKey)
      ?.configurationIndexUidSegment
      ?? (yamlNested?.kind === "collection" ? yamlNested.configurationIndexUidSegment : undefined)
    currentRule = itemRule
  }
  if (lastProperty === undefined || currentRule.itemType !== event.itemType) return undefined
  return {
    itemRule: currentRule,
    propertyRule: lastProperty,
    steps,
    ...(lastCollectionUidSegment === undefined ? {} : { collectionUidSegment: lastCollectionUidSegment }),
  }
}

interface FactRuleStep {
  readonly propertyRule: PropertyRule
  readonly propertyKey: string
  readonly ownerRule: MetadataItemRule
  readonly collection: boolean
}

function isPreparedImportFacts(
  prepared: PreparedImportYaml | PreparedImportFacts,
): prepared is PreparedImportFacts {
  return "semanticFacts" in prepared
}

function objectTargetForFile(
  file: ValidationProjectFile
): Extract<ParsedMetadataTarget, { kind: "object" }> | undefined {
  return objectTargetForProjectFile(file)
}

function ownerMemberIndexEntries(params: {
  projectDir: string
  file: ValidationProjectFile
  prepared: PreparedImportYaml | PreparedImportFacts
  readProperty: (yamlKey: string) => unknown
  facts: ValidationOwnerFacts
}): ProjectMemberIndexEntry[] {
  const objectTarget = objectTargetForFile(params.file)
  if (objectTarget === undefined) return []
  const entries: ProjectMemberIndexEntry[] = []
  const seen = new Set<string>()

  for (const field of params.facts.fieldIndex.fields.values()) {
    appendMember(entries, seen, fieldTarget(objectTarget, field, params.facts.filePath))
    if (field.kind !== "tabularSection" || field.tableSource === undefined) continue
    for (const column of field.tableSource.columns.values()) {
      appendMember(entries, seen, nestedFieldTarget(objectTarget, field.name, column, params.facts.filePath))
    }
  }

  const owner: OwnerMetadata = {
    ref: params.facts.ref,
    filePath: params.facts.filePath,
    facts: params.facts,
    fieldIndex: params.facts.fieldIndex,
    rule: params.prepared.rule,
    spec: params.file.owner.spec,
  }
  for (const { contributor } of getProjectReferenceMemberIndexContributors()) {
    for (const entry of contributor({
      projectDir: params.projectDir,
      owner,
      objectTarget,
      readProperty: params.readProperty,
    })) {
      appendMember(entries, seen, entry)
    }
  }
  return entries
}

function rawYamlMemberIndexEntries(params: {
  projectDir: string
  file: ValidationProjectFile
  prepared: PreparedImportYaml | PreparedImportFacts
  readProperty: (yamlKey: string) => unknown
}): ProjectMemberIndexEntry[] {
  const objectTarget = objectTargetForFile(params.file)
  if (objectTarget === undefined) return []
  const ref = { kind: params.file.owner.dir, name: params.file.owner.name }
  const fieldIndex = { fields: new Map(), standardAttributeAliases: new Map(), diagnostics: [] }
  const owner: OwnerMetadata = {
    ref,
    filePath: params.prepared.targetProjectPath,
    facts: { ref, filePath: params.prepared.targetProjectPath, fieldIndex },
    fieldIndex,
    rule: params.prepared.rule,
    spec: params.file.owner.spec,
  }
  return getProjectReferenceMemberIndexContributors().flatMap(({ contributor }) =>
    [...contributor({
      projectDir: params.projectDir,
      owner,
      objectTarget,
      readProperty: params.readProperty,
    })]
  )
}

function mergeMemberIndexEntries(entries: readonly ProjectMemberIndexEntry[]): ProjectMemberIndexEntry[] {
  const merged = new Map<string, ProjectMemberIndexEntry>()
  for (const entry of entries) if (!merged.has(entry.canonical)) merged.set(entry.canonical, entry)
  return [...merged.values()]
}

function fieldTarget(
  object: Extract<ParsedMetadataTarget, { kind: "object" }>,
  field: ObjectField,
  filePath: string
): ProjectMemberIndexEntry {
  const target: Extract<ParsedMetadataTarget, { kind: "member" }> = {
    kind: "member",
    root: object.root,
    objectName: object.objectName,
    ...(object.segments === undefined ? {} : { objectSegments: object.segments }),
    segments: [{ kind: metadataFieldKind(field.kind), name: field.targetName ?? field.name }],
  }
  return {
    canonical: projectMemberIndexKey(target),
    target,
    result: { ok: true, filePath, details: field },
  }
}

function nestedFieldTarget(
  object: Extract<ParsedMetadataTarget, { kind: "object" }>,
  tabularSectionName: string,
  field: ObjectField,
  filePath: string
): ProjectMemberIndexEntry {
  const target: Extract<ParsedMetadataTarget, { kind: "member" }> = {
    kind: "member",
    root: object.root,
    objectName: object.objectName,
    ...(object.segments === undefined ? {} : { objectSegments: object.segments }),
    segments: [
      { kind: "TabularSection", name: tabularSectionName },
      { kind: metadataFieldKind(field.kind), name: field.targetName ?? field.name },
    ],
  }
  return {
    canonical: projectMemberIndexKey(target),
    target,
    result: { ok: true, filePath, details: field },
  }
}

function metadataFieldKind(kind: ObjectFieldKind): MetadataFieldKind {
  switch (kind) {
    case "attribute":
      return "Attribute"
    case "standardAttribute":
      return "StandardAttribute"
    case "tabularSection":
      return "TabularSection"
    case "dimension":
      return "Dimension"
    case "resource":
      return "Resource"
    case "addressingAttribute":
      return "AddressingAttribute"
  }
}

function appendMember(entries: ProjectMemberIndexEntry[], seen: Set<string>, entry: ProjectMemberIndexEntry): void {
  if (seen.has(entry.canonical)) return
  seen.add(entry.canonical)
  entries.push(entry)
}

function formMemberIndexEntries(file: ValidationProjectFile): ProjectMemberIndexEntry[] {
  if (file.kind !== "form" || file.formName === undefined) return []
  const root = rootFromYAML[file.owner.dir]
  if (root === undefined) return []
  const target: Extract<ParsedMetadataTarget, { kind: "member" }> = {
    kind: "member",
    root,
    objectName: file.owner.name,
    segments: [{ kind: "Form", name: file.formName }],
  }
  return [
    {
      canonical: projectMemberIndexKey(target),
      target,
      result: {
        ok: true,
        filePath: file.projectPath,
        details: { kind: "Form", name: file.formName },
      },
    },
  ]
}

function ownerRecord(params: {
  file: ValidationProjectFile
  facts: ValidationOwnerFacts
  objectIndexEntries: ProjectObjectIndexEntry[]
  memberIndexEntries: ProjectMemberIndexEntry[]
  pendingReferences: PendingMetadataTargetReference[]
}): ValidationObjectRecord {
  return {
    filePath: params.file.projectPath,
    projectPath: params.file.projectPath,
    kind: params.file.kind,
    owner: { dir: params.file.owner.dir, name: params.file.owner.name },
    ownerRef: params.facts.ref,
    ownerFacts: params.facts,
    fieldIndex: params.facts.fieldIndex,
    objectIndexEntries: params.objectIndexEntries,
    memberIndexEntries: params.memberIndexEntries,
    valueIndexEntries: [],
    pendingReferences: params.pendingReferences,
    importDiagnostics: [],
  }
}

function metadataRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {}
}
