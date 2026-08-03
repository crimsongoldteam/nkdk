import type { ProjectStateFileUpdate, ProjectStateReferenceEntry } from "../fileUpdate"
import { encodeProjectStateHeader, type ProjectStateSectionDescriptor } from "./format"
import { buildBinaryHashIndex } from "./hashIndex"
import {
  ProjectStateFileRecordView,
  ProjectStateFileSectionHeaderView,
  ProjectStateHashSlotRecordView,
  ProjectStateHeaderRecordView,
  ProjectStateLookupSectionHeaderView,
  ProjectStateSectionRecordView,
  ProjectStateTargetEntryRecordView,
  ProjectStateTargetRangeRecordView,
  type ProjectStateFileRecord,
  type ProjectStateTargetEntryRecord,
  type ProjectStateTargetRangeRecord,
} from "./layouts"
import {
  hashProjectStateTargetKey,
  ProjectStateSnapshotView,
  type ProjectStateSharedBuffers,
} from "./snapshot"
import {
  BinaryStringPoolBuilder,
  packBinaryStringPool,
  readBinaryString,
} from "./stringPool"
import { encodeBinaryValue } from "./valueCodec"

export interface ProjectStateSnapshotPatch {
  readonly update: ProjectStateFileUpdate
  readonly hash: bigint
}

interface CandidateFile {
  readonly projectPath: string
  readonly baseFileId?: number
  readonly record: Omit<
    ProjectStateFileRecord,
    "factsOffset" | "factsByteLength" | "diagnosticsOffset" | "diagnosticsByteLength"
  >
  readonly facts: Uint8Array
  readonly diagnostics: Uint8Array
  readonly references?: readonly ProjectStateReferenceEntry[]
}

interface TargetDraft extends ProjectStateTargetEntryRecord {}

const MAX_UINT32 = 0xffff_ffff
const TARGET_KIND_IDS: Readonly<Record<ProjectStateReferenceEntry["kind"], number>> = {
  object: 1,
  member: 2,
  value: 3,
}
const YAML_ROLE_IDS = { configuration: 1, properties: 2, form: 3 } as const

function assertUint32(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_UINT32) {
    throw new Error(`${field} не помещается в uint32`)
  }
}

function binarySearch(sorted: readonly string[], value: string): boolean {
  let low = 0
  let high = sorted.length - 1
  while (low <= high) {
    const middle = (low + high) >>> 1
    const candidate = sorted[middle]
    if (candidate === value) return true
    if (candidate < value) low = middle + 1
    else high = middle - 1
  }
  return false
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function assertUniqueSorted(values: readonly string[], field: string): void {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index - 1] === values[index]) throw new Error(`${field} содержит повтор: ${values[index]}`)
  }
}

function yamlFacts(update: Extract<ProjectStateFileUpdate, { kind: "yaml" }>) {
  return {
    references: update.references,
    pendingReferences: update.pendingReferences,
    owners: update.owners,
    fields: update.fields,
    forms: update.forms,
    pendingChecks: update.pendingChecks,
    dependencies: update.dependencies,
  }
}

export function buildProjectStateSnapshot(input: {
  readonly base?: ProjectStateSharedBuffers
  readonly replacements: readonly ProjectStateSnapshotPatch[]
  readonly deletions: readonly string[]
}): ProjectStateSharedBuffers {
  const base = input.base === undefined ? undefined : new ProjectStateSnapshotView(input.base)
  const strings = new BinaryStringPoolBuilder(base?.stringPool())
  const replacements = [...input.replacements].sort((left, right) =>
    compareStrings(left.update.projectPath, right.update.projectPath),
  )
  const replacementPaths = replacements.map(({ update }) => update.projectPath)
  const deletions = [...input.deletions].sort()
  assertUniqueSorted(replacementPaths, "replacements")
  assertUniqueSorted(deletions, "deletions")

  const replacementCandidates = replacements.map(({ update, hash }): CandidateFile => {
    if (hash < 0n || hash > 0xffff_ffff_ffff_ffffn) {
      throw new Error(`Хэш файла ${update.projectPath} вне диапазона uint64`)
    }
    const projectPathId = strings.intern(update.projectPath)
    const componentPathId = strings.intern(update.componentPath)
    if (update.kind === "resource") {
      return {
        projectPath: update.projectPath,
        record: {
          projectPathId,
          componentPathId,
          hash,
          resourceKind: 2,
          yamlRole: 0,
          updateKind: 2,
          reserved: 0,
        },
        facts: new Uint8Array(),
        diagnostics: new Uint8Array(),
      }
    }
    return {
      projectPath: update.projectPath,
      record: {
        projectPathId,
        componentPathId,
        hash,
        resourceKind: 1,
        yamlRole: YAML_ROLE_IDS[update.yamlRole!],
        updateKind: 1,
        reserved: 0,
      },
      facts: encodeBinaryValue(yamlFacts(update), strings),
      diagnostics: encodeBinaryValue(update.localValidation, strings),
      references: update.references,
    }
  })

  const retainedBase: CandidateFile[] = []
  if (base !== undefined) {
    for (let fileId = 0; fileId < base.fileCount; fileId += 1) {
      const projectPath = base.filePath(fileId)
      if (binarySearch(replacementPaths, projectPath) || binarySearch(deletions, projectPath)) continue
      const record = base.fileRecord(fileId)
      retainedBase.push({
        projectPath,
        baseFileId: fileId,
        record: {
          projectPathId: record.projectPathId,
          componentPathId: record.componentPathId,
          hash: record.hash,
          resourceKind: record.resourceKind,
          yamlRole: record.yamlRole,
          updateKind: record.updateKind,
          reserved: 0,
        },
        facts: base.factBytes(fileId),
        diagnostics: base.diagnosticBytes(fileId),
      })
    }
  }

  const candidates = mergeCandidates(retainedBase, replacementCandidates)
  const oldToNew = new Int32Array(base?.fileCount ?? 0)
  oldToNew.fill(-1)
  candidates.forEach((candidate, fileId) => {
    if (candidate.baseFileId !== undefined) oldToNew[candidate.baseFileId] = fileId
  })

  const targetDrafts: TargetDraft[] = []
  if (base !== undefined) {
    for (let entryId = 0; entryId < base.targetEntryCount; entryId += 1) {
      const entry = base.targetEntry(entryId)
      const sourceFileId = oldToNew[entry.sourceFileId]
      if (sourceFileId >= 0) targetDrafts.push({ ...entry, sourceFileId })
    }
  }
  candidates.forEach((candidate, sourceFileId) => {
    if (candidate.references === undefined) return
    for (const reference of candidate.references) {
      targetDrafts.push({
        componentPathId: candidate.record.componentPathId,
        canonicalId: strings.intern(reference.canonical),
        sourceFileId,
        kind: TARGET_KIND_IDS[reference.kind],
        reserved8: 0,
        reserved16: 0,
      })
    }
  })

  const stringPool = strings.finish()
  targetDrafts.sort((left, right) =>
    left.componentPathId - right.componentPathId ||
    left.canonicalId - right.canonicalId ||
    left.sourceFileId - right.sourceFileId ||
    left.kind - right.kind,
  )

  const facts = concatenateCandidateBytes(candidates, "facts")
  const diagnostics = concatenateCandidateBytes(candidates, "diagnostics")
  const files = buildFilesBuffer(candidates)
  const lookups = buildLookupsBuffer(targetDrafts, stringPool)
  const stringSection = packBinaryStringPool(stringPool)
  const sectionBuffers = [stringSection, files, facts, lookups, diagnostics] as const
  const kinds = ["strings", "files", "facts", "lookups", "diagnostics"] as const
  const headerByteLength =
    ProjectStateHeaderRecordView.viewLength +
    kinds.length * ProjectStateSectionRecordView.viewLength
  let offset = headerByteLength
  const sections: ProjectStateSectionDescriptor[] = kinds.map((kind, index) => {
    const byteLength = sectionBuffers[index].byteLength
    const descriptor = {
      kind,
      offset,
      byteLength,
      records: kind === "strings" ? stringPool.count : kind === "files" ? candidates.length : 0,
    }
    offset += byteLength
    return descriptor
  })
  const encodedHeader = encodeProjectStateHeader({ sections, payloadHash: 0n })
  const header = new SharedArrayBuffer(encodedHeader.byteLength)
  new Uint8Array(header).set(encodedHeader)

  return { header, strings: stringSection, files, facts, lookups, diagnostics }
}

function mergeCandidates(
  base: readonly CandidateFile[],
  replacements: readonly CandidateFile[],
): CandidateFile[] {
  const result: CandidateFile[] = []
  let baseIndex = 0
  let replacementIndex = 0
  while (baseIndex < base.length || replacementIndex < replacements.length) {
    const baseCandidate = base[baseIndex]
    const replacement = replacements[replacementIndex]
    if (replacement === undefined || (baseCandidate !== undefined && baseCandidate.projectPath < replacement.projectPath)) {
      result.push(baseCandidate!)
      baseIndex += 1
    } else {
      result.push(replacement)
      replacementIndex += 1
    }
  }
  return result
}

function concatenateCandidateBytes(
  candidates: readonly CandidateFile[],
  field: "facts" | "diagnostics",
): SharedArrayBuffer {
  const byteLength = candidates.reduce((total, candidate) => total + candidate[field].byteLength, 0)
  assertUint32(byteLength, `Размер раздела ${field}`)
  const buffer = new SharedArrayBuffer(byteLength)
  const bytes = new Uint8Array(buffer)
  let offset = 0
  for (const candidate of candidates) {
    bytes.set(candidate[field], offset)
    offset += candidate[field].byteLength
  }
  return buffer
}

function buildFilesBuffer(candidates: readonly CandidateFile[]): SharedArrayBuffer {
  const byteLength =
    ProjectStateFileSectionHeaderView.viewLength +
    candidates.length * ProjectStateFileRecordView.viewLength
  assertUint32(byteLength, "Размер раздела файлов")
  const buffer = new SharedArrayBuffer(byteLength)
  const view = new DataView(buffer)
  ProjectStateFileSectionHeaderView.encode(
    { count: candidates.length, recordsOffset: ProjectStateFileSectionHeaderView.viewLength },
    view,
  )
  let factsOffset = 0
  let diagnosticsOffset = 0
  candidates.forEach((candidate, fileId) => {
    ProjectStateFileRecordView.encode(
      {
        ...candidate.record,
        factsOffset,
        factsByteLength: candidate.facts.byteLength,
        diagnosticsOffset,
        diagnosticsByteLength: candidate.diagnostics.byteLength,
      },
      view,
      ProjectStateFileSectionHeaderView.viewLength + fileId * ProjectStateFileRecordView.viewLength,
    )
    factsOffset += candidate.facts.byteLength
    diagnosticsOffset += candidate.diagnostics.byteLength
  })
  return buffer
}

function buildLookupsBuffer(
  entries: readonly TargetDraft[],
  strings: ReturnType<BinaryStringPoolBuilder["finish"]>,
): SharedArrayBuffer {
  const ranges: ProjectStateTargetRangeRecord[] = []
  for (let start = 0; start < entries.length;) {
    const first = entries[start]
    let end = start + 1
    while (
      end < entries.length &&
      entries[end].componentPathId === first.componentPathId &&
      entries[end].canonicalId === first.canonicalId
    ) {
      end += 1
    }
    ranges.push({
      componentPathId: first.componentPathId,
      canonicalId: first.canonicalId,
      start,
      count: end - start,
    })
    start = end
  }
  const hashes = BigUint64Array.from(ranges, (range) =>
    hashProjectStateTargetKey(
      readBinaryString(strings, range.componentPathId),
      readBinaryString(strings, range.canonicalId),
    ),
  )
  const index = buildBinaryHashIndex(
    hashes,
    Uint32Array.from({ length: ranges.length }, (_, id) => id),
  )
  const entriesOffset = ProjectStateLookupSectionHeaderView.viewLength
  const rangesOffset = entriesOffset + entries.length * ProjectStateTargetEntryRecordView.viewLength
  const indexOffset = rangesOffset + ranges.length * ProjectStateTargetRangeRecordView.viewLength
  const byteLength = indexOffset + index.capacity * ProjectStateHashSlotRecordView.viewLength
  assertUint32(byteLength, "Размер раздела индексов")
  const buffer = new SharedArrayBuffer(byteLength)
  const view = new DataView(buffer)
  ProjectStateLookupSectionHeaderView.encode(
    {
      targetEntryCount: entries.length,
      targetRangeCount: ranges.length,
      entriesOffset,
      rangesOffset,
      indexOffset,
      indexSize: index.size,
      indexCapacity: index.capacity,
    },
    view,
  )
  entries.forEach((entry, entryId) => {
    ProjectStateTargetEntryRecordView.encode(
      entry,
      view,
      entriesOffset + entryId * ProjectStateTargetEntryRecordView.viewLength,
    )
  })
  ranges.forEach((range, rangeId) => {
    ProjectStateTargetRangeRecordView.encode(
      range,
      view,
      rangesOffset + rangeId * ProjectStateTargetRangeRecordView.viewLength,
    )
  })
  new Uint8Array(buffer).set(
    new Uint8Array(
      index.slots,
      index.byteOffset ?? 0,
      index.capacity * ProjectStateHashSlotRecordView.viewLength,
    ),
    indexOffset,
  )
  return buffer
}
