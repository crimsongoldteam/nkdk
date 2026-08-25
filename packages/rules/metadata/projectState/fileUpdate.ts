import { assertProjectStateFileUpdateBatch, PROJECT_STATE_HASH_BYTE_LENGTH } from "./fileUpdateValidation"
import type { Diagnostic } from "../validation/types"
import type { ProjectValidationFirstPassResult } from "../validation/projectValidationPasses"
import type { ValidationObjectRecord } from "../validation/projectValidationTypes"
import type { ValidationPendingCheck } from "../validation/projectValidationPendingChecks"
import { projectMetadataReferenceDetails } from "../validation/projectMetadataReferences"
import type {
  ProjectStateDiagnostic,
  ProjectStateFieldEntry,
  ProjectStateFileIdentity,
  ProjectStateFileUpdateBatch,
  ProjectStateFileUpdateBatchEntry,
  ProjectStateFormEntry,
  ProjectStateOwnerFact,
  ProjectStatePendingDependencyCheck,
  ProjectStateStructuredDocumentEntry,
  ProjectStateTargetEntry,
  ProjectStateYamlFileUpdate,
} from "./contracts/fileUpdate"

export type * from "./contracts/fileUpdate"

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
  identity: ProjectStateFileIdentity,
  fileBackedTargets: readonly ProjectStateTargetEntry[] = [],
  structuredDocuments: readonly ProjectStateStructuredDocumentEntry[] = [],
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
    targets: [
      ...firstPassResult.objectIndexEntries.map((entry) => projectStateTargetEntry("object", entry)),
      ...firstPassResult.memberIndexEntries.map((entry) => projectStateTargetEntry("member", entry)),
      ...firstPassResult.valueIndexEntries.map((entry) => projectStateTargetEntry("value", entry)),
      ...logicalAddressTargetEntries(firstPassResult),
      ...fileBackedTargets,
    ],
    pendingReferences: firstPassResult.pendingReferences.map(({ filePath: _filePath, ...reference }) => reference),
    owners: firstPassResult.objectRecords.flatMap(projectStateOwnerFacts),
    fields: firstPassResult.objectRecords.flatMap(projectStateFieldEntries),
    forms: projectStateFormEntries(firstPassResult.form),
    pendingChecks:
      firstPassResult.state.kind === "form" || firstPassResult.state.kind === "properties"
        ? firstPassResult.state.pendingChecks.map(projectStatePendingCheck)
        : [],
    dependencies: [...new Set(firstPassResult.dependencies ?? [])],
    ...(firstPassResult.validationContextDependencies === undefined
      ? {}
      : { validationContextDependencies: firstPassResult.validationContextDependencies }),
    ...(structuredDocuments.length === 0 ? {} : { structuredDocuments }),
  }
}

function logicalAddressTargetEntries(
  result: ProjectValidationFirstPassResult,
): ProjectStateTargetEntry[] {
  const indexed = new Set([
    ...result.objectIndexEntries,
    ...result.memberIndexEntries,
    ...result.valueIndexEntries,
  ].map(({ canonical }) => canonical))
  return (result.logicalAddresses ?? [])
    .filter(({ logicalAddress }) => !indexed.has(logicalAddress))
    .map(({ logicalAddress }) => ({ kind: "object", canonical: logicalAddress }))
}

export function projectStateTargetEntry(
  kind: ProjectStateTargetEntry["kind"],
  entry: { readonly canonical: string; readonly result: { readonly ok: boolean; readonly details?: unknown } },
): ProjectStateTargetEntry {
  const details = entry.result.ok ? projectMetadataReferenceDetails(entry.result.details) : undefined
  return { kind, canonical: entry.canonical, ...(details === undefined ? {} : { details }) }
}

export function isolateProjectStateYamlUpdate(
  update: ProjectStateYamlFileUpdate,
): ProjectStateYamlFileUpdate {
  return {
    ...update,
    localValidation: {
      contributedFacts: update.localValidation.contributedFacts,
      diagnostics: update.localValidation.schemaDiagnostics,
      schemaDiagnostics: update.localValidation.schemaDiagnostics,
    },
    targets: [],
    owners: [],
    fields: [],
    forms: [],
    pendingReferences: [],
    pendingChecks: [],
    dependencies: [],
  }
}

function withoutDiagnosticFilePath({ filePath: _filePath, ...diagnostic }: Diagnostic): ProjectStateDiagnostic {
  return diagnostic
}

export function projectStateOwnerFacts(record: ValidationObjectRecord): ProjectStateOwnerFact[] {
  if (record.ownerFacts === undefined) return []
  const { ref, filePath: _filePath, fieldIndex: _fieldIndex, ...facts } = record.ownerFacts
  return [{ owner: ref, facts }]
}

export function projectStateFieldEntries(record: ValidationObjectRecord): ProjectStateFieldEntry[] {
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
  for (const [name, declaration] of index.tabularElementsByName) {
    entries.push({
      kind: "tabularElement",
      owner,
      name,
      ...(declaration.dataPath === undefined ? {} : { dataPath: declaration.dataPath }),
    })
  }
  return entries
}

function projectStatePendingCheck(check: ValidationPendingCheck): ProjectStatePendingDependencyCheck {
  const { filePath: _filePath, ...location } = check.location
  if (check.kind === "fillValue") {
    return {
      kind: "fillValue",
      yamlPath: check.yamlPath,
      location,
      itemType: check.itemType,
      type: check.type,
      value: check.value,
      ...(check.xmlAnomaly === undefined ? {} : { xmlAnomaly: check.xmlAnomaly }),
      ...(check.transport === undefined ? {} : { transport: check.transport }),
    }
  }
  if (check.kind === "addressableRequired") {
    return {
      kind: "addressableRequired",
      yamlPath: check.yamlPath,
      location,
      canonicalTarget: check.canonicalTarget,
      missing: check.missing,
    }
  }
  if (check.kind === "referenceCoverage") {
    return {
      kind: "referenceCoverage",
      yamlPath: check.yamlPath,
      location,
      requirements: check.requirements,
    }
  }
  return {
    kind: "dataPath",
    yamlPath: check.yamlPath,
    location,
    owner: check.owner,
    value: check.value,
    ...(check.xmlAnomaly === undefined ? {} : { xmlAnomaly: check.xmlAnomaly }),
    policyInput: check.policyInput,
    ...(check.elementType === undefined ? {} : { elementType: check.elementType }),
    ...(check.hasValuesPicture === undefined ? {} : { hasValuesPicture: check.hasValuesPicture }),
    ...(check.tableContext === undefined ? {} : { tableContext: check.tableContext }),
    policy: check.policy,
  }
}


export { assertProjectStateFileUpdateBatch } from "./fileUpdateValidation"
