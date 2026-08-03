import { View } from "structurae"

interface ProjectStateHeaderRecord {
  readonly magicFirst: number
  readonly magicSecond: number
  readonly major: number
  readonly minor: number
  readonly patch: number
  readonly sectionCount: number
  readonly payloadHash: bigint
  readonly headerByteLength: number
  readonly reserved: number
}

interface ProjectStateSectionRecord {
  readonly kind: number
  readonly reserved: number
  readonly offset: number
  readonly byteLength: number
  readonly records: number
}

interface ProjectStateHashSlotRecord {
  readonly hash: bigint
  readonly recordId: number
  readonly occupied: number
  readonly reserved8: number
  readonly reserved16: number
}

interface ProjectStateStringRecord {
  readonly offset: number
  readonly byteLength: number
}

export interface ProjectStateStringSectionHeader {
  readonly count: number
  readonly recordsOffset: number
  readonly utf8Offset: number
  readonly utf8ByteLength: number
  readonly lookupOffset: number
  readonly lookupSize: number
  readonly lookupCapacity: number
}

export interface ProjectStateFileSectionHeader {
  readonly count: number
  readonly recordsOffset: number
}

export interface ProjectStateFileRecord {
  readonly projectPathId: number
  readonly componentPathId: number
  readonly hash: bigint
  readonly factsOffset: number
  readonly factsByteLength: number
  readonly diagnosticsOffset: number
  readonly diagnosticsByteLength: number
  readonly resourceKind: number
  readonly yamlRole: number
  readonly updateKind: number
  readonly reserved: number
}

export interface ProjectStateLookupSectionHeader {
  readonly targetEntryCount: number
  readonly targetRangeCount: number
  readonly entriesOffset: number
  readonly rangesOffset: number
  readonly indexOffset: number
  readonly indexSize: number
  readonly indexCapacity: number
  readonly ownerEntryCount: number
  readonly ownerRangeCount: number
  readonly ownerEntriesOffset: number
  readonly ownerRangesOffset: number
  readonly ownerIndexOffset: number
  readonly ownerIndexSize: number
  readonly ownerIndexCapacity: number
}

export interface ProjectStateTargetEntryRecord {
  readonly componentPathId: number
  readonly canonicalId: number
  readonly sourceFileId: number
  readonly kind: number
  readonly reserved8: number
  readonly reserved16: number
}

export interface ProjectStateTargetRangeRecord {
  readonly componentPathId: number
  readonly canonicalId: number
  readonly start: number
  readonly count: number
}

export interface ProjectStateOwnerEntryRecord {
  readonly ownerKeyId: number
  readonly sourceFileId: number
}

export interface ProjectStateOwnerRangeRecord {
  readonly ownerKeyId: number
  readonly start: number
  readonly count: number
  readonly reserved: number
}

const projectStateView = new View()

export const ProjectStateHeaderRecordView = projectStateView.create<ProjectStateHeaderRecord>({
  $id: "ProjectStateHeaderRecord",
  type: "object",
  properties: {
    magicFirst: { type: "integer", btype: "uint32" },
    magicSecond: { type: "integer", btype: "uint32" },
    major: { type: "integer", btype: "uint16" },
    minor: { type: "integer", btype: "uint16" },
    patch: { type: "integer", btype: "uint16" },
    sectionCount: { type: "integer", btype: "uint16" },
    payloadHash: { type: "number", btype: "biguint64" },
    headerByteLength: { type: "integer", btype: "uint32" },
    reserved: { type: "integer", btype: "uint32" },
  },
})

export const ProjectStateSectionRecordView = projectStateView.create<ProjectStateSectionRecord>({
  $id: "ProjectStateSectionRecord",
  type: "object",
  properties: {
    kind: { type: "integer", btype: "uint16" },
    reserved: { type: "integer", btype: "uint16" },
    offset: { type: "integer", btype: "uint32" },
    byteLength: { type: "integer", btype: "uint32" },
    records: { type: "integer", btype: "uint32" },
  },
})

export const ProjectStateHashSlotRecordView =
  projectStateView.create<ProjectStateHashSlotRecord>({
    $id: "ProjectStateHashSlotRecord",
    type: "object",
    properties: {
      hash: { type: "number", btype: "biguint64" },
      recordId: { type: "integer", btype: "uint32" },
      occupied: { type: "integer", btype: "uint8" },
      reserved8: { type: "integer", btype: "uint8" },
      reserved16: { type: "integer", btype: "uint16" },
    },
  })

export const ProjectStateStringRecordView = projectStateView.create<ProjectStateStringRecord>({
  $id: "ProjectStateStringRecord",
  type: "object",
  properties: {
    offset: { type: "integer", btype: "uint32" },
    byteLength: { type: "integer", btype: "uint32" },
  },
})

export const ProjectStateStringSectionHeaderView =
  projectStateView.create<ProjectStateStringSectionHeader>({
    $id: "ProjectStateStringSectionHeader",
    type: "object",
    properties: {
      count: { type: "integer", btype: "uint32" },
      recordsOffset: { type: "integer", btype: "uint32" },
      utf8Offset: { type: "integer", btype: "uint32" },
      utf8ByteLength: { type: "integer", btype: "uint32" },
      lookupOffset: { type: "integer", btype: "uint32" },
      lookupSize: { type: "integer", btype: "uint32" },
      lookupCapacity: { type: "integer", btype: "uint32" },
    },
  })

export const ProjectStateFileSectionHeaderView =
  projectStateView.create<ProjectStateFileSectionHeader>({
    $id: "ProjectStateFileSectionHeader",
    type: "object",
    properties: {
      count: { type: "integer", btype: "uint32" },
      recordsOffset: { type: "integer", btype: "uint32" },
    },
  })

export const ProjectStateFileRecordView = projectStateView.create<ProjectStateFileRecord>({
  $id: "ProjectStateFileRecord",
  type: "object",
  properties: {
    projectPathId: { type: "integer", btype: "uint32" },
    componentPathId: { type: "integer", btype: "uint32" },
    hash: { type: "number", btype: "biguint64" },
    factsOffset: { type: "integer", btype: "uint32" },
    factsByteLength: { type: "integer", btype: "uint32" },
    diagnosticsOffset: { type: "integer", btype: "uint32" },
    diagnosticsByteLength: { type: "integer", btype: "uint32" },
    resourceKind: { type: "integer", btype: "uint8" },
    yamlRole: { type: "integer", btype: "uint8" },
    updateKind: { type: "integer", btype: "uint8" },
    reserved: { type: "integer", btype: "uint8" },
  },
})

export const ProjectStateLookupSectionHeaderView =
  projectStateView.create<ProjectStateLookupSectionHeader>({
    $id: "ProjectStateLookupSectionHeader",
    type: "object",
    properties: {
      targetEntryCount: { type: "integer", btype: "uint32" },
      targetRangeCount: { type: "integer", btype: "uint32" },
      entriesOffset: { type: "integer", btype: "uint32" },
      rangesOffset: { type: "integer", btype: "uint32" },
      indexOffset: { type: "integer", btype: "uint32" },
      indexSize: { type: "integer", btype: "uint32" },
      indexCapacity: { type: "integer", btype: "uint32" },
      ownerEntryCount: { type: "integer", btype: "uint32" },
      ownerRangeCount: { type: "integer", btype: "uint32" },
      ownerEntriesOffset: { type: "integer", btype: "uint32" },
      ownerRangesOffset: { type: "integer", btype: "uint32" },
      ownerIndexOffset: { type: "integer", btype: "uint32" },
      ownerIndexSize: { type: "integer", btype: "uint32" },
      ownerIndexCapacity: { type: "integer", btype: "uint32" },
    },
  })

export const ProjectStateTargetEntryRecordView =
  projectStateView.create<ProjectStateTargetEntryRecord>({
    $id: "ProjectStateTargetEntryRecord",
    type: "object",
    properties: {
      componentPathId: { type: "integer", btype: "uint32" },
      canonicalId: { type: "integer", btype: "uint32" },
      sourceFileId: { type: "integer", btype: "uint32" },
      kind: { type: "integer", btype: "uint8" },
      reserved8: { type: "integer", btype: "uint8" },
      reserved16: { type: "integer", btype: "uint16" },
    },
  })

export const ProjectStateTargetRangeRecordView =
  projectStateView.create<ProjectStateTargetRangeRecord>({
    $id: "ProjectStateTargetRangeRecord",
    type: "object",
    properties: {
      componentPathId: { type: "integer", btype: "uint32" },
      canonicalId: { type: "integer", btype: "uint32" },
      start: { type: "integer", btype: "uint32" },
      count: { type: "integer", btype: "uint32" },
    },
  })

export const ProjectStateOwnerEntryRecordView =
  projectStateView.create<ProjectStateOwnerEntryRecord>({
    $id: "ProjectStateOwnerEntryRecord",
    type: "object",
    properties: {
      ownerKeyId: { type: "integer", btype: "uint32" },
      sourceFileId: { type: "integer", btype: "uint32" },
    },
  })

export const ProjectStateOwnerRangeRecordView =
  projectStateView.create<ProjectStateOwnerRangeRecord>({
    $id: "ProjectStateOwnerRangeRecord",
    type: "object",
    properties: {
      ownerKeyId: { type: "integer", btype: "uint32" },
      start: { type: "integer", btype: "uint32" },
      count: { type: "integer", btype: "uint32" },
      reserved: { type: "integer", btype: "uint32" },
    },
  })
