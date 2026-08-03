import { xxh3 } from "@node-rs/xxhash"
import { decodeProjectStateHeader, type ProjectStateSectionKind } from "./format"
import { findBinaryHashIndex, type BinaryHashIndex } from "./hashIndex"
import {
  ProjectStateFileRecordView,
  ProjectStateFileSectionHeaderView,
  ProjectStateHashSlotRecordView,
  ProjectStateHeaderRecordView,
  ProjectStateLookupSectionHeaderView,
  ProjectStateOwnerEntryRecordView,
  ProjectStateOwnerRangeRecordView,
  ProjectStateSectionRecordView,
  ProjectStateTargetEntryRecordView,
  ProjectStateTargetRangeRecordView,
  type ProjectStateFileRecord,
  type ProjectStateLookupSectionHeader,
  type ProjectStateOwnerEntryRecord,
  type ProjectStateOwnerRangeRecord,
  type ProjectStateTargetEntryRecord,
} from "./layouts"
import { openBinaryStringPool, readBinaryString, type BinaryStringPool } from "./stringPool"
import { decodeBinaryValue } from "./valueCodec"

export interface ProjectStateSharedBuffers {
  readonly header: SharedArrayBuffer
  readonly strings: SharedArrayBuffer
  readonly files: SharedArrayBuffer
  readonly facts: SharedArrayBuffer
  readonly lookups: SharedArrayBuffer
  readonly diagnostics: SharedArrayBuffer
}

export interface ProjectStateSnapshotTarget {
  readonly kind: "object" | "member" | "value"
  readonly canonical: string
  readonly sourceFileId: number
  readonly projectPath: string
  readonly componentPath: string
}

export interface ProjectStateHashIndexStats {
  readonly size: number
  readonly capacity: number
  readonly loadFactor: number
}

const SECTION_ORDER: readonly ProjectStateSectionKind[] = [
  "strings",
  "files",
  "facts",
  "lookups",
  "diagnostics",
]

const TARGET_KINDS = ["object", "member", "value"] as const
const textEncoder = new TextEncoder()

export function hashProjectStateTargetKey(componentPath: string, canonical: string): bigint {
  const componentBytes = textEncoder.encode(componentPath)
  const canonicalBytes = textEncoder.encode(canonical)
  const bytes = new Uint8Array(4 + componentBytes.byteLength + canonicalBytes.byteLength)
  new DataView(bytes.buffer).setUint32(0, componentBytes.byteLength, true)
  bytes.set(componentBytes, 4)
  bytes.set(canonicalBytes, 4 + componentBytes.byteLength)
  return xxh3.xxh64(bytes)
}

export class ProjectStateSnapshotView {
  readonly #strings: BinaryStringPool
  readonly #fileCount: number
  readonly #fileRecordsOffset: number
  readonly #lookupHeader: ProjectStateLookupSectionHeader
  readonly #targetIndex: BinaryHashIndex
  readonly #ownerIndex: BinaryHashIndex

  constructor(readonly buffers: ProjectStateSharedBuffers) {
    for (const [name, buffer] of Object.entries(buffers)) {
      if (!(buffer instanceof SharedArrayBuffer)) {
        throw new Error(`Буфер ${name} должен быть SharedArrayBuffer`)
      }
    }

    const header = decodeProjectStateHeader(new Uint8Array(buffers.header))
    if (
      buffers.header.byteLength !==
      ProjectStateHeaderRecordView.viewLength +
        SECTION_ORDER.length * ProjectStateSectionRecordView.viewLength
    ) {
      throw new Error("Неверный размер заголовка снимка")
    }
    let expectedOffset = buffers.header.byteLength
    const sectionBuffers = [
      buffers.strings,
      buffers.files,
      buffers.facts,
      buffers.lookups,
      buffers.diagnostics,
    ]
    header.sections.forEach((section, index) => {
      if (
        section.kind !== SECTION_ORDER[index] ||
        section.offset !== expectedOffset ||
        section.byteLength !== sectionBuffers[index]?.byteLength
      ) {
        throw new Error("Каталог разделов снимка не соответствует общим буферам")
      }
      expectedOffset += section.byteLength
    })
    if (header.sections.length !== SECTION_ORDER.length) {
      throw new Error("Снимок должен содержать все разделы")
    }

    this.#strings = openBinaryStringPool(buffers.strings)
    if (buffers.files.byteLength < ProjectStateFileSectionHeaderView.viewLength) {
      throw new Error("Раздел файлов оборван")
    }
    const fileHeader = ProjectStateFileSectionHeaderView.decode(new DataView(buffers.files))
    if (
      fileHeader.recordsOffset !== ProjectStateFileSectionHeaderView.viewLength ||
      fileHeader.recordsOffset + fileHeader.count * ProjectStateFileRecordView.viewLength !==
        buffers.files.byteLength
    ) {
      throw new Error("Повреждена структура раздела файлов")
    }
    this.#fileCount = fileHeader.count
    this.#fileRecordsOffset = fileHeader.recordsOffset

    if (buffers.lookups.byteLength < ProjectStateLookupSectionHeaderView.viewLength) {
      throw new Error("Раздел индексов оборван")
    }
    this.#lookupHeader = ProjectStateLookupSectionHeaderView.decode(
      new DataView(buffers.lookups),
    )
    const expectedRangesOffset =
      this.#lookupHeader.entriesOffset +
      this.#lookupHeader.targetEntryCount * ProjectStateTargetEntryRecordView.viewLength
    const expectedIndexOffset =
      expectedRangesOffset +
      this.#lookupHeader.targetRangeCount * ProjectStateTargetRangeRecordView.viewLength
    const expectedOwnerEntriesOffset =
      expectedIndexOffset +
      this.#lookupHeader.indexCapacity * ProjectStateHashSlotRecordView.viewLength
    const expectedOwnerRangesOffset =
      expectedOwnerEntriesOffset +
      this.#lookupHeader.ownerEntryCount * ProjectStateOwnerEntryRecordView.viewLength
    const expectedOwnerIndexOffset =
      expectedOwnerRangesOffset +
      this.#lookupHeader.ownerRangeCount * ProjectStateOwnerRangeRecordView.viewLength
    const expectedLookupBytes =
      expectedOwnerIndexOffset +
      this.#lookupHeader.ownerIndexCapacity * ProjectStateHashSlotRecordView.viewLength
    if (
      this.#lookupHeader.entriesOffset !== ProjectStateLookupSectionHeaderView.viewLength ||
      this.#lookupHeader.rangesOffset !== expectedRangesOffset ||
      this.#lookupHeader.indexOffset !== expectedIndexOffset ||
      this.#lookupHeader.ownerEntriesOffset !== expectedOwnerEntriesOffset ||
      this.#lookupHeader.ownerRangesOffset !== expectedOwnerRangesOffset ||
      this.#lookupHeader.ownerIndexOffset !== expectedOwnerIndexOffset ||
      expectedLookupBytes !== buffers.lookups.byteLength ||
      this.#lookupHeader.indexSize !== this.#lookupHeader.targetRangeCount ||
      this.#lookupHeader.ownerIndexSize !== this.#lookupHeader.ownerRangeCount
    ) {
      throw new Error("Повреждена структура раздела индексов")
    }
    this.#targetIndex = {
      slots: buffers.lookups,
      byteOffset: this.#lookupHeader.indexOffset,
      size: this.#lookupHeader.indexSize,
      capacity: this.#lookupHeader.indexCapacity,
    }
    this.#ownerIndex = {
      slots: buffers.lookups,
      byteOffset: this.#lookupHeader.ownerIndexOffset,
      size: this.#lookupHeader.ownerIndexSize,
      capacity: this.#lookupHeader.ownerIndexCapacity,
    }
  }

  get fileCount(): number {
    return this.#fileCount
  }

  get targetEntryCount(): number {
    return this.#lookupHeader.targetEntryCount
  }

  get targetRangeCount(): number {
    return this.#lookupHeader.targetRangeCount
  }

  get ownerEntryCount(): number {
    return this.#lookupHeader.ownerEntryCount
  }

  get ownerRangeCount(): number {
    return this.#lookupHeader.ownerRangeCount
  }

  stringPool(): BinaryStringPool {
    return this.#strings
  }

  hashIndexStats(): {
    readonly strings: ProjectStateHashIndexStats
    readonly targets: ProjectStateHashIndexStats
    readonly owners: ProjectStateHashIndexStats
  } {
    return {
      strings: hashIndexStats(this.#strings.lookup),
      targets: hashIndexStats(this.#targetIndex),
      owners: hashIndexStats(this.#ownerIndex),
    }
  }

  stringValue(id: number): string {
    return readBinaryString(this.#strings, id)
  }

  fileRecord(fileId: number): ProjectStateFileRecord {
    this.#assertFileId(fileId)
    return ProjectStateFileRecordView.decode(
      new DataView(this.buffers.files),
      this.#fileRecordsOffset + fileId * ProjectStateFileRecordView.viewLength,
    )
  }

  filePath(fileId: number): string {
    return readBinaryString(this.#strings, this.fileRecord(fileId).projectPathId)
  }

  componentPath(fileId: number): string {
    return readBinaryString(this.#strings, this.fileRecord(fileId).componentPathId)
  }

  filePaths(): string[] {
    return Array.from({ length: this.#fileCount }, (_, fileId) => this.filePath(fileId))
  }

  findFile(projectPath: string): number | undefined {
    let low = 0
    let high = this.#fileCount - 1
    while (low <= high) {
      const middle = (low + high) >>> 1
      const candidate = this.filePath(middle)
      if (candidate === projectPath) return middle
      if (candidate < projectPath) low = middle + 1
      else high = middle - 1
    }
    return undefined
  }

  factBytes(fileId: number): Uint8Array<SharedArrayBuffer> {
    const record = this.fileRecord(fileId)
    return this.#range(this.buffers.facts, record.factsOffset, record.factsByteLength, "фактов")
  }

  diagnosticBytes(fileId: number): Uint8Array<SharedArrayBuffer> {
    const record = this.fileRecord(fileId)
    return this.#range(
      this.buffers.diagnostics,
      record.diagnosticsOffset,
      record.diagnosticsByteLength,
      "диагностик",
    )
  }

  decodeFacts(fileId: number): unknown {
    const bytes = this.factBytes(fileId)
    return bytes.byteLength === 0 ? undefined : decodeBinaryValue(bytes, this.#strings)
  }

  decodeDiagnostics(fileId: number): unknown {
    const bytes = this.diagnosticBytes(fileId)
    return bytes.byteLength === 0 ? undefined : decodeBinaryValue(bytes, this.#strings)
  }

  targetEntry(entryId: number): ProjectStateTargetEntryRecord {
    if (!Number.isSafeInteger(entryId) || entryId < 0 || entryId >= this.targetEntryCount) {
      throw new Error(`Неизвестная запись индекса целей: ${entryId}`)
    }
    return ProjectStateTargetEntryRecordView.decode(
      new DataView(this.buffers.lookups),
      this.#lookupHeader.entriesOffset + entryId * ProjectStateTargetEntryRecordView.viewLength,
    )
  }

  targetRange(rangeId: number) {
    if (!Number.isSafeInteger(rangeId) || rangeId < 0 || rangeId >= this.targetRangeCount) {
      throw new Error(`Неизвестный диапазон индекса целей: ${rangeId}`)
    }
    return ProjectStateTargetRangeRecordView.decode(
      new DataView(this.buffers.lookups),
      this.#lookupHeader.rangesOffset + rangeId * ProjectStateTargetRangeRecordView.viewLength,
    )
  }

  ownerEntry(entryId: number): ProjectStateOwnerEntryRecord {
    if (!Number.isSafeInteger(entryId) || entryId < 0 || entryId >= this.ownerEntryCount) {
      throw new Error(`Неизвестная запись индекса владельцев: ${entryId}`)
    }
    return ProjectStateOwnerEntryRecordView.decode(
      new DataView(this.buffers.lookups),
      this.#lookupHeader.ownerEntriesOffset + entryId * ProjectStateOwnerEntryRecordView.viewLength,
    )
  }

  ownerRange(rangeId: number): ProjectStateOwnerRangeRecord {
    if (!Number.isSafeInteger(rangeId) || rangeId < 0 || rangeId >= this.ownerRangeCount) {
      throw new Error(`Неизвестный диапазон индекса владельцев: ${rangeId}`)
    }
    return ProjectStateOwnerRangeRecordView.decode(
      new DataView(this.buffers.lookups),
      this.#lookupHeader.ownerRangesOffset + rangeId * ProjectStateOwnerRangeRecordView.viewLength,
    )
  }

  lookupOwnerKey(ownerKey: string): ProjectStateOwnerEntryRecord[] {
    const rangeId = findBinaryHashIndex(
      this.#ownerIndex,
      hashProjectStateTargetKey("owner", ownerKey),
      (candidateId) => this.stringValue(this.ownerRange(candidateId).ownerKeyId) === ownerKey,
    )
    if (rangeId === undefined) return []
    const range = this.ownerRange(rangeId)
    return Array.from({ length: range.count }, (_, index) => this.ownerEntry(range.start + index))
  }

  lookupTarget(componentPath: string, canonical: string): ProjectStateSnapshotTarget[] {
    const rangeId = findBinaryHashIndex(
      this.#targetIndex,
      hashProjectStateTargetKey(componentPath, canonical),
      (candidateId) => {
        const candidate = ProjectStateTargetRangeRecordView.decode(
          new DataView(this.buffers.lookups),
          this.#lookupHeader.rangesOffset +
            candidateId * ProjectStateTargetRangeRecordView.viewLength,
        )
        return (
          readBinaryString(this.#strings, candidate.componentPathId) === componentPath &&
          readBinaryString(this.#strings, candidate.canonicalId) === canonical
        )
      },
    )
    if (rangeId === undefined) return []

    const range = this.targetRange(rangeId)
    return Array.from({ length: range.count }, (_, index) => {
      const entry = this.targetEntry(range.start + index)
      const kind = TARGET_KINDS[entry.kind - 1]
      if (kind === undefined) throw new Error(`Неизвестный вид цели: ${entry.kind}`)
      return {
        kind,
        canonical: readBinaryString(this.#strings, entry.canonicalId),
        sourceFileId: entry.sourceFileId,
        projectPath: this.filePath(entry.sourceFileId),
        componentPath: readBinaryString(this.#strings, entry.componentPathId),
      }
    })
  }

  #assertFileId(fileId: number): void {
    if (!Number.isSafeInteger(fileId) || fileId < 0 || fileId >= this.#fileCount) {
      throw new Error(`Неизвестный файл снимка: ${fileId}`)
    }
  }

  #range(
    buffer: SharedArrayBuffer,
    offset: number,
    byteLength: number,
    section: string,
  ): Uint8Array<SharedArrayBuffer> {
    if (offset + byteLength > buffer.byteLength) {
      throw new Error(`Повреждён диапазон ${section} файла`)
    }
    return new Uint8Array(buffer, offset, byteLength)
  }
}

function hashIndexStats(index: BinaryHashIndex): ProjectStateHashIndexStats {
  return {
    size: index.size,
    capacity: index.capacity,
    loadFactor: index.size / index.capacity,
  }
}
