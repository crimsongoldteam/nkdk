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
import type { ProjectLocalDependency } from "../projectDefinition/componentIndexFacts"
import type { PreparedImportYaml } from "./prepareYaml"
import type { PreparedImportFacts } from "./prepareFacts"
import { extractImportOwnerFacts } from "./ownerFacts"

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
  })
}

export function extractImportValidationContributionFromFacts(params: {
  prepared: PreparedImportFacts
  projectDir: string
  file: ValidationProjectFile
  measure?: ImportValidationContributionMeasure
}): ImportValidationContribution {
  return extractImportValidationContributionCore({
    ...params,
    rawYaml: params.prepared.semanticProjection,
  })
}

function extractImportValidationContributionCore(params: {
  prepared: PreparedImportYaml | PreparedImportFacts
  projectDir: string
  file: ValidationProjectFile
  rawYaml: unknown
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

  const ownerFacts = measure(
    "Сбор сведений о владельцах и полях",
    () => extractImportOwnerFacts(params.prepared),
  )
  const objectIndexEntries = measure(
    "Сбор объектов общего индекса",
    () => objectIndexEntriesForFile(file, params.rawYaml, params.prepared),
  )
  const memberIndexEntries = measure(
    "Сбор полей общего индекса",
    () => ownerFacts.flatMap((facts) =>
      ownerMemberIndexEntries({
        projectDir: params.projectDir,
        file,
        prepared: params.prepared,
        rawYaml: params.rawYaml,
        facts,
      })
    ),
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
        ? collectAddressableLogicalAddressesFromFacts(params.prepared)
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
): ProjectObjectIndexEntry[] {
  const target = objectTargetForFile(file)
  if (target === undefined) return []
  const data = metadataRecord(yaml)
  const type = data["Тип"]

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

function collectAddressableLogicalAddressesFromFacts(
  prepared: PreparedImportFacts,
): Array<{ logicalAddress: string; sourceProjectPath: string }> {
  const addressesByYamlPath = new Map<string, string>()
  const entries: Array<{ logicalAddress: string; sourceProjectPath: string }> = []
  for (const event of prepared.localIndexes.metadata.events) {
    if (event.kind !== "item" || event.name === undefined) continue
    const resolved = resolveFactItemRule(prepared.rule, event)
    if (resolved === undefined) continue
    const external = resolved.itemRule.externalMetadata
    const addressable = external?.placement === "ownedEntry" || external?.placement === "ownerChild"
    const segment = resolved.propertyRule.configurationIndexUidSegment
      ?? resolved.collectionUidSegment
      ?? external?.segment
    if ((!addressable && resolved.itemRule.properties.uuid === undefined) || segment === undefined) continue
    const parent = nearestFactParent(addressesByYamlPath, event.yamlPath)
      ?? prepared.assignment.logicalAddress
    const logicalAddress = `${parent}.${segment}.${event.name}`
    addressesByYamlPath.set(yamlPathKey(event.yamlPath), logicalAddress)
    entries.push({ logicalAddress, sourceProjectPath: prepared.assignment.targetProjectPath })
  }
  return entries
}

function collectAddressableObjectEntriesFromFacts(
  prepared: PreparedImportFacts,
  canonicalTarget: string,
  filePath: string,
): ProjectObjectIndexEntry[] {
  const targetsByYamlPath = new Map<string, string>()
  const entries: ProjectObjectIndexEntry[] = []
  for (const event of prepared.localIndexes.metadata.events) {
    if (event.kind !== "item" || event.name === undefined) continue
    const resolved = resolveFactItemRule(prepared.rule, event)
    const external = resolved?.itemRule.externalMetadata
    if (external?.placement !== "ownedEntry") continue
    const parent = nearestFactParent(targetsByYamlPath, event.yamlPath) ?? canonicalTarget
    const canonical = `${parent}.${external.segment}.${event.name}`
    const parsed = parseMetadataTargetFromModel({
      canonical,
      constraint: { kind: "object", allowNested: true },
    })
    if (!parsed.ok || parsed.target.kind !== "object") {
      throw new Error(`Некорректный адресуемый metadata target: ${canonical}`)
    }
    targetsByYamlPath.set(yamlPathKey(event.yamlPath), canonical)
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
} | undefined {
  let currentRule = rootRule
  let lastProperty: PropertyRule | undefined
  let lastCollectionUidSegment: string | undefined
  for (const segment of event.rulePath) {
    const propertyRule = currentRule.properties[segment.propertyKey]
    if (propertyRule === undefined) return undefined
    const nested = getTypeRule(propertyRule.type, "nestedItemRule")
    const nestedItemType = segment.nestedItemType ?? event.itemType
    const itemRule = nested === undefined
      ? undefined
      : "itemRule" in nested
        ? nested.itemRule
        : nested.resolveItemRule(nestedItemType)
    if (itemRule === undefined) continue
    lastProperty = propertyRule
    lastCollectionUidSegment = currentRule.childCollections
      ?.find(({ propertyKey }) => propertyKey === segment.propertyKey)
      ?.configurationIndexUidSegment
    currentRule = itemRule
  }
  if (lastProperty === undefined || currentRule.itemType !== event.itemType) return undefined
  return {
    itemRule: currentRule,
    propertyRule: lastProperty,
    ...(lastCollectionUidSegment === undefined ? {} : { collectionUidSegment: lastCollectionUidSegment }),
  }
}

function nearestFactParent(
  values: ReadonlyMap<string, string>,
  yamlPath: readonly (string | number)[],
): string | undefined {
  for (let length = yamlPath.length - 1; length > 0; length -= 1) {
    const value = values.get(yamlPathKey(yamlPath.slice(0, length)))
    if (value !== undefined) return value
  }
  return undefined
}

function yamlPathKey(path: readonly (string | number)[]): string {
  return JSON.stringify(path)
}

function isPreparedImportFacts(
  prepared: PreparedImportYaml | PreparedImportFacts,
): prepared is PreparedImportFacts {
  return "reconstructionFacts" in prepared
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
  rawYaml: unknown
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
  for (const contributor of getProjectReferenceMemberIndexContributors()) {
    for (const entry of contributor({
      projectDir: params.projectDir,
      owner,
      objectTarget,
      rawYaml: params.rawYaml,
    })) {
      appendMember(entries, seen, entry)
    }
  }
  return entries
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
