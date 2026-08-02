import type { ElementType } from "../orchestration/formElement/types"
import { assertProjectStateFileUpdateBatch, PROJECT_STATE_HASH_BYTE_LENGTH } from "./fileUpdateValidation"
import type { MetadataProjectResourceKind, MetadataProjectYamlRole } from "../project/resources"
import type { ObjectFieldKind } from "../validation/dataPath/objectFields"
import type {
  DataPathTableInfo,
  DataPathTypeInfo,
  FormDataPathColumnSource,
  FormDataPathSource,
  OwnerTypeRef,
} from "../validation/dataPath/types"
import type { DataPathPolicyInput } from "../validation/dataPath/policies"
import type { ParsedMetadataTarget, MetadataTargetConstraint } from "../commonObjects/metadataTargets/types"
import type { Diagnostic } from "../validation/types"
import type { YamlDiagnosticLocation, YamlPath } from "../validation/yamlLocations"
import type { ProjectValidationFirstPassResult } from "../validation/projectValidationPasses"
import type { ValidationObjectRecord } from "../validation/projectValidationTypes"
import type { ValidationOwnerFacts } from "../validation/dataPath/ownerFacts"
import type { ValidationPendingCheck } from "../validation/projectValidationPendingChecks"
import {
  projectMetadataReferenceDetails,
  type ProjectMetadataReferenceDetails,
} from "../validation/projectMetadataReferences"

export interface ProjectStateFileIdentity {
  readonly projectPath: string
  readonly componentPath: string
  readonly resourceKind: MetadataProjectResourceKind
  readonly yamlRole?: MetadataProjectYamlRole
}

export interface ProjectStateResourceUpdate extends ProjectStateFileIdentity {
  readonly kind: "resource"
}

export type ProjectStateDiagnostic = Omit<Diagnostic, "filePath">

export interface ProjectStateLocalValidationResult {
  readonly contributedFacts: boolean
  readonly diagnostics: readonly ProjectStateDiagnostic[]
  readonly schemaDiagnostics: readonly ProjectStateDiagnostic[]
}

export interface ProjectStateReferenceEntry {
  readonly kind: "object" | "member" | "value"
  readonly canonical: string
  readonly details?: ProjectMetadataReferenceDetails
}

export interface ProjectStatePendingReference {
  readonly yamlPath: YamlPath
  readonly canonical: string
  readonly target: ParsedMetadataTarget
  readonly constraint: MetadataTargetConstraint
}

export interface ProjectStateOwnerFact {
  readonly owner: OwnerTypeRef
  readonly facts: ProjectStateOwnerFacts
}

export type ProjectStateOwnerFacts = Omit<ValidationOwnerFacts, "ref" | "filePath" | "fieldIndex">

export interface ProjectStateFieldEntry {
  readonly owner: OwnerTypeRef
  readonly name: string
  readonly kind: ObjectFieldKind
  readonly typeInfo: DataPathTypeInfo
  readonly targetName?: string
  readonly sourceCollection?: string
  readonly parentName?: string
  readonly table?: DataPathTableInfo
  readonly tableHasColumns?: boolean
}

export type ProjectStateFormEntry =
  | {
      readonly kind: "root"
      readonly owner: OwnerTypeRef
      readonly name: string
      readonly source: ProjectStateFormSource
    }
  | {
      readonly kind: "additionalColumn"
      readonly owner: OwnerTypeRef
      readonly tablePath: string
      readonly name: string
      readonly source: FormDataPathColumnSource
    }

export interface ProjectStateFormSource {
  readonly kind: FormDataPathSource["kind"]
  readonly name: string
  readonly typeInfo: DataPathTypeInfo
  readonly table?: DataPathTableInfo
  readonly tableHasColumns?: boolean
}

export interface ProjectStatePendingDependencyCheck {
  readonly kind: "dataPath"
  readonly yamlPath: YamlPath
  readonly location: Omit<YamlDiagnosticLocation, "filePath">
  readonly owner: OwnerTypeRef
  readonly value: string
  readonly policyInput: DataPathPolicyInput
  readonly elementType?: ElementType
  readonly hasValuesPicture?: boolean
  readonly tableContext?: { readonly dataPath: string }
  readonly policy: "formDataPath"
}

export interface ProjectStateYamlFileUpdate extends ProjectStateFileIdentity {
  readonly kind: "yaml"
  readonly localValidation: ProjectStateLocalValidationResult
  readonly references: readonly ProjectStateReferenceEntry[]
  readonly pendingReferences: readonly ProjectStatePendingReference[]
  readonly owners: readonly ProjectStateOwnerFact[]
  readonly fields: readonly ProjectStateFieldEntry[]
  readonly forms: readonly ProjectStateFormEntry[]
  readonly pendingChecks: readonly ProjectStatePendingDependencyCheck[]
  readonly dependencies: readonly string[]
}

export type ProjectStateFileUpdate = ProjectStateResourceUpdate | ProjectStateYamlFileUpdate

export interface ProjectStateFileUpdateBatch {
  readonly updates: readonly ProjectStateFileUpdate[]
  readonly hashBytes: Uint8Array
}

export type ProjectStateFileUpdateBatchEntry =
  | { readonly update: ProjectStateFileUpdate; readonly hash: bigint; readonly hashBytes?: never }
  | { readonly update: ProjectStateFileUpdate; readonly hash?: never; readonly hashBytes: Uint8Array }

const HASH_BYTE_LENGTH = PROJECT_STATE_HASH_BYTE_LENGTH
const MAX_HASH = (1n << 64n) - 1n

export function createProjectStateFileUpdateBatch(
  entries: readonly ProjectStateFileUpdateBatchEntry[]
): ProjectStateFileUpdateBatch {
  const hashBytes = new Uint8Array(entries.length * HASH_BYTE_LENGTH)
  const view = new DataView(hashBytes.buffer)

  entries.forEach((entry, index) => {
    const offset = index * HASH_BYTE_LENGTH
    if (entry.hashBytes !== undefined) {
      if (entry.hashBytes.byteLength !== HASH_BYTE_LENGTH) {
        throw new Error("xxHash64 должен занимать ровно 8 байт")
      }
      hashBytes.set(entry.hashBytes, offset)
      return
    }
    if (entry.hash < 0n || entry.hash > MAX_HASH) throw new Error("xxHash64 вне диапазона uint64")
    view.setBigUint64(offset, entry.hash, false)
  })

  const batch = { updates: entries.map(({ update }) => update), hashBytes }
  assertProjectStateFileUpdateBatch(batch)
  return batch
}

export function toProjectStateFileUpdate(
  firstPassResult: ProjectValidationFirstPassResult,
  identity: ProjectStateFileIdentity
): ProjectStateYamlFileUpdate {
  if (identity.resourceKind !== "yaml" || identity.yamlRole === undefined) {
    throw new Error("Результат первого прохода можно связать только с YAML-файлом")
  }

  return {
    ...identity,
    kind: "yaml",
    localValidation: {
      contributedFacts: firstPassResult.contributedFacts,
      diagnostics: firstPassResult.diagnostics.map(withoutDiagnosticFilePath),
      schemaDiagnostics: firstPassResult.schemaDiagnostics.map(withoutDiagnosticFilePath),
    },
    references: [
      ...firstPassResult.objectIndexEntries.map((entry) => projectStateReferenceEntry("object", entry)),
      ...firstPassResult.memberIndexEntries.map((entry) => projectStateReferenceEntry("member", entry)),
      ...firstPassResult.valueIndexEntries.map((entry) => projectStateReferenceEntry("value", entry)),
    ],
    pendingReferences: firstPassResult.pendingReferences.map(({ filePath: _filePath, ...reference }) => reference),
    owners: firstPassResult.objectRecords.flatMap(projectStateOwnerFacts),
    fields: firstPassResult.objectRecords.flatMap(projectStateFieldEntries),
    forms: projectStateFormEntries(firstPassResult.form),
    pendingChecks:
      firstPassResult.state.kind === "form"
        ? firstPassResult.state.pendingChecks.map(projectStatePendingCheck)
        : [],
    dependencies: [...new Set(firstPassResult.dependencies ?? [])],
  }
}

function projectStateReferenceEntry(
  kind: ProjectStateReferenceEntry["kind"],
  entry: { readonly canonical: string; readonly result: { readonly ok: boolean; readonly details?: unknown } },
): ProjectStateReferenceEntry {
  const details = entry.result.ok ? projectMetadataReferenceDetails(entry.result.details) : undefined
  return { kind, canonical: entry.canonical, ...(details === undefined ? {} : { details }) }
}

function withoutDiagnosticFilePath({ filePath: _filePath, ...diagnostic }: Diagnostic): ProjectStateDiagnostic {
  return diagnostic
}

function projectStateOwnerFacts(record: ValidationObjectRecord): ProjectStateOwnerFact[] {
  if (record.ownerFacts === undefined) return []
  const { ref, filePath: _filePath, fieldIndex: _fieldIndex, ...facts } = record.ownerFacts
  return [{ owner: ref, facts }]
}

function projectStateFieldEntries(record: ValidationObjectRecord): ProjectStateFieldEntry[] {
  const owner = record.ownerRef ?? record.ownerFacts?.ref
  const index = record.fieldIndex ?? record.ownerFacts?.fieldIndex
  if (owner === undefined || index === undefined) return []

  const entries: ProjectStateFieldEntry[] = []
  const seen = new Set<string>()
  for (const field of index.fields.values()) {
    addUniqueField(entries, seen, {
      owner,
      name: field.name,
      kind: field.kind,
      typeInfo: field.typeInfo,
      ...(field.targetName === undefined ? {} : { targetName: field.targetName }),
      ...(field.sourceCollection === undefined ? {} : { sourceCollection: field.sourceCollection }),
      ...(field.tableSource === undefined
        ? {}
        : { table: field.tableSource.table, tableHasColumns: field.tableSource.hasColumns }),
    })
    for (const column of field.tableSource?.columns.values() ?? []) {
      addUniqueField(entries, seen, {
        owner,
        parentName: field.name,
        name: column.name,
        kind: column.kind,
        typeInfo: column.typeInfo,
        ...(column.targetName === undefined ? {} : { targetName: column.targetName }),
        ...(column.sourceCollection === undefined ? {} : { sourceCollection: column.sourceCollection }),
      })
    }
  }
  return entries
}

function addUniqueField(
  entries: ProjectStateFieldEntry[],
  seen: Set<string>,
  entry: ProjectStateFieldEntry
): void {
  const key = `${entry.parentName ?? ""}\0${entry.kind}\0${entry.name}`
  if (seen.has(key)) return
  seen.add(key)
  entries.push(entry)
}

function projectStateFormEntries(form: ProjectValidationFirstPassResult["form"]): ProjectStateFormEntry[] {
  if (form === undefined) return []
  const { owner, index } = form
  const entries: ProjectStateFormEntry[] = []

  for (const source of index.roots.values()) {
    entries.push({
      kind: "root",
      owner,
      name: source.name,
      source: {
        kind: source.kind,
        name: source.name,
        typeInfo: source.typeInfo,
        ...(source.tableSource === undefined
          ? {}
          : { table: source.tableSource.table, tableHasColumns: source.tableSource.hasColumns }),
      },
    })
    for (const column of source.tableSource?.columns.values() ?? []) {
      entries.push({
        kind: "additionalColumn",
        owner,
        tablePath: source.name,
        name: column.name,
        source: column,
      })
    }
  }
  for (const [tablePath, columns] of index.additionalColumnsByTablePath) {
    for (const column of columns.values()) {
      entries.push({ kind: "additionalColumn", owner, tablePath, name: column.name, source: column })
    }
  }
  return entries
}

function projectStatePendingCheck(check: ValidationPendingCheck): ProjectStatePendingDependencyCheck {
  const { filePath: _filePath, ...location } = check.location
  return {
    kind: "dataPath",
    yamlPath: check.yamlPath,
    location,
    owner: check.owner,
    value: check.value,
    policyInput: check.policyInput,
    ...(check.elementType === undefined ? {} : { elementType: check.elementType }),
    ...(check.hasValuesPicture === undefined ? {} : { hasValuesPicture: check.hasValuesPicture }),
    ...(check.tableContext === undefined ? {} : { tableContext: check.tableContext }),
    policy: check.policy,
  }
}


export { assertProjectStateFileUpdateBatch } from "./fileUpdateValidation"
