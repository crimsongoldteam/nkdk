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

export interface ProjectStateFactSectionHeader {
  readonly tableCount: number
  readonly catalogOffset: number
}

export interface ProjectStateFactTableRecord {
  readonly kind: number
  readonly reserved: number
  readonly offset: number
  readonly records: number
  readonly recordByteLength: number
}

export interface ProjectStateValidationStatusRecord {
  readonly sourceFileId: number
  readonly contributedFacts: number
  readonly reserved8: number
  readonly reserved16: number
  readonly diagnosticsStart: number
  readonly diagnosticsCount: number
  readonly schemaDiagnosticsStart: number
  readonly schemaDiagnosticsCount: number
}

export interface ProjectStateReferenceRecord {
  readonly sourceFileId: number
  readonly canonicalId: number
  readonly detailsId: number
  readonly kind: number
  readonly reserved8: number
  readonly reserved16: number
}

export interface ProjectStateReferenceDetailsRecord {
  readonly typeInfoId: number
  readonly sourceTextId: number
  readonly kind: number
  readonly styleItemType: number
  readonly reserved: number
}

export interface ProjectStatePendingReferenceRecord {
  readonly sourceFileId: number
  readonly yamlPathId: number
  readonly canonicalId: number
  readonly targetKindId: number
  readonly targetRootId: number
  readonly targetNameId: number
  readonly targetMemberId: number
  readonly constraintKindId: number
}

export interface ProjectStateOwnerRecord {
  readonly sourceFileId: number
  readonly kindId: number
  readonly nameId: number
  readonly factsStart: number
  readonly factsCount: number
}

export interface ProjectStateOwnerFactRecord {
  readonly ownerId: number
  readonly roleId: number
  readonly valueKind: number
  readonly reserved: number
  readonly valueId: number
  readonly itemsStart: number
  readonly itemsCount: number
}

export interface ProjectStateFieldRecord {
  readonly sourceFileId: number
  readonly ownerId: number
  readonly nameId: number
  readonly targetNameId: number
  readonly sourceCollectionId: number
  readonly parentNameId: number
  readonly typeInfoId: number
  readonly tableInfoId: number
  readonly kind: number
  readonly tableHasColumns: number
  readonly reserved: number
}

export interface ProjectStateTypeInfoRecord {
  readonly kindsStart: number
  readonly kindsCount: number
  readonly nextTypesStart: number
  readonly nextTypesCount: number
  readonly definedTypesStart: number
  readonly definedTypesCount: number
  readonly tableInfoId: number
  readonly sourceTextId: number
  readonly isComposite: number
  readonly reserved8: number
  readonly reserved16: number
}

export interface ProjectStateStringValueRecord {
  readonly valueId: number
}

export interface ProjectStateOwnerTypeRecord {
  readonly kindId: number
  readonly nameId: number
}

export interface ProjectStateTableInfoRecord {
  readonly ownerTypeId: number
  readonly nameId: number
  readonly kind: number
  readonly reserved8: number
  readonly reserved16: number
}

export interface ProjectStateFormRecord {
  readonly sourceFileId: number
  readonly ownerTypeId: number
  readonly nameId: number
  readonly tablePathId: number
  readonly typeInfoId: number
  readonly tableInfoId: number
  readonly kind: number
  readonly tableHasColumns: number
  readonly reserved: number
}

export interface ProjectStatePendingCheckRecord {
  readonly sourceFileId: number
  readonly yamlPathId: number
  readonly line: number
  readonly col: number
  readonly pathId: number
  readonly ownerTypeId: number
  readonly valueId: number
  readonly policyYamlId: number
  readonly allowedKindsStart: number
  readonly allowedKindsCount: number
  readonly elementTypeId: number
  readonly tableContextId: number
  readonly allowComposite: number
  readonly hasValuesPicture: number
  readonly reserved: number
}

export interface ProjectStateDependencyRecord {
  readonly sourceFileId: number
  readonly projectPathId: number
}

export interface ProjectStateYamlPathRecord {
  readonly segmentsStart: number
  readonly segmentsCount: number
}

export interface ProjectStateYamlPathSegmentRecord {
  readonly stringId: number
  readonly numericValue: number
  readonly kind: number
  readonly reserved8: number
  readonly reserved16: number
}

export interface ProjectStateDiagnosticSectionHeader {
  readonly count: number
  readonly recordsOffset: number
}

export interface ProjectStateDiagnosticRecord {
  readonly sourceFileId: number
  readonly line: number
  readonly col: number
  readonly messageId: number
  readonly pathId: number
  readonly severity: number
  readonly source: number
  readonly reserved: number
}

const projectStateView = new View()
const uint8Field = { type: "integer", btype: "uint8" } as const
const uint16Field = { type: "integer", btype: "uint16" } as const
const uint32Field = { type: "integer", btype: "uint32" } as const

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

export const ProjectStateFactSectionHeaderView =
  projectStateView.create<ProjectStateFactSectionHeader>({
    $id: "ProjectStateFactSectionHeader",
    type: "object",
    properties: {
      tableCount: { type: "integer", btype: "uint32" },
      catalogOffset: { type: "integer", btype: "uint32" },
    },
  })

export const ProjectStateFactTableRecordView =
  projectStateView.create<ProjectStateFactTableRecord>({
    $id: "ProjectStateFactTableRecord",
    type: "object",
    properties: {
      kind: { type: "integer", btype: "uint16" },
      reserved: { type: "integer", btype: "uint16" },
      offset: { type: "integer", btype: "uint32" },
      records: { type: "integer", btype: "uint32" },
      recordByteLength: { type: "integer", btype: "uint32" },
    },
  })

export const ProjectStateValidationStatusRecordView =
  projectStateView.create<ProjectStateValidationStatusRecord>({
    $id: "ProjectStateValidationStatusRecord",
    type: "object",
    properties: {
      sourceFileId: { type: "integer", btype: "uint32" },
      contributedFacts: { type: "integer", btype: "uint8" },
      reserved8: { type: "integer", btype: "uint8" },
      reserved16: { type: "integer", btype: "uint16" },
      diagnosticsStart: { type: "integer", btype: "uint32" },
      diagnosticsCount: { type: "integer", btype: "uint32" },
      schemaDiagnosticsStart: { type: "integer", btype: "uint32" },
      schemaDiagnosticsCount: { type: "integer", btype: "uint32" },
    },
  })

export const ProjectStateReferenceRecordView = projectStateView.create<ProjectStateReferenceRecord>({
  $id: "ProjectStateReferenceRecord",
  type: "object",
  properties: {
    sourceFileId: uint32Field, canonicalId: uint32Field, detailsId: uint32Field,
    kind: uint8Field, reserved8: uint8Field, reserved16: uint16Field,
  },
})

export const ProjectStateReferenceDetailsRecordView = projectStateView.create<ProjectStateReferenceDetailsRecord>({
  $id: "ProjectStateReferenceDetailsRecord",
  type: "object",
  properties: {
    typeInfoId: { type: "integer", btype: "uint32" },
    sourceTextId: { type: "integer", btype: "uint32" },
    kind: { type: "integer", btype: "uint8" },
    styleItemType: { type: "integer", btype: "uint8" },
    reserved: { type: "integer", btype: "uint16" },
  },
})

export const ProjectStatePendingReferenceRecordView = projectStateView.create<ProjectStatePendingReferenceRecord>({
  $id: "ProjectStatePendingReferenceRecord",
  type: "object",
  properties: {
    sourceFileId: { type: "integer", btype: "uint32" },
    yamlPathId: { type: "integer", btype: "uint32" },
    canonicalId: { type: "integer", btype: "uint32" },
    targetKindId: { type: "integer", btype: "uint32" },
    targetRootId: { type: "integer", btype: "uint32" },
    targetNameId: { type: "integer", btype: "uint32" },
    targetMemberId: { type: "integer", btype: "uint32" },
    constraintKindId: { type: "integer", btype: "uint32" },
  },
})

export const ProjectStateOwnerRecordView = projectStateView.create<ProjectStateOwnerRecord>({
  $id: "ProjectStateOwnerRecord",
  type: "object",
  properties: {
    sourceFileId: { type: "integer", btype: "uint32" },
    kindId: { type: "integer", btype: "uint32" },
    nameId: { type: "integer", btype: "uint32" },
    factsStart: { type: "integer", btype: "uint32" },
    factsCount: { type: "integer", btype: "uint32" },
  },
})

export const ProjectStateOwnerFactRecordView = projectStateView.create<ProjectStateOwnerFactRecord>({
  $id: "ProjectStateOwnerFactRecord",
  type: "object",
  properties: {
    ownerId: { type: "integer", btype: "uint32" },
    roleId: { type: "integer", btype: "uint32" },
    valueKind: { type: "integer", btype: "uint16" },
    reserved: { type: "integer", btype: "uint16" },
    valueId: { type: "integer", btype: "uint32" },
    itemsStart: { type: "integer", btype: "uint32" },
    itemsCount: { type: "integer", btype: "uint32" },
  },
})

export const ProjectStateFieldRecordView = projectStateView.create<ProjectStateFieldRecord>({
  $id: "ProjectStateFieldRecord",
  type: "object",
  properties: {
    sourceFileId: uint32Field, ownerId: uint32Field, nameId: uint32Field,
    targetNameId: uint32Field, sourceCollectionId: uint32Field, parentNameId: uint32Field,
    typeInfoId: uint32Field, tableInfoId: uint32Field,
    kind: uint8Field, tableHasColumns: uint8Field, reserved: uint16Field,
  },
})

export const ProjectStateTypeInfoRecordView = projectStateView.create<ProjectStateTypeInfoRecord>({
  $id: "ProjectStateTypeInfoRecord",
  type: "object",
  properties: {
    kindsStart: { type: "integer", btype: "uint32" },
    kindsCount: { type: "integer", btype: "uint32" },
    nextTypesStart: { type: "integer", btype: "uint32" },
    nextTypesCount: { type: "integer", btype: "uint32" },
    definedTypesStart: { type: "integer", btype: "uint32" },
    definedTypesCount: { type: "integer", btype: "uint32" },
    tableInfoId: { type: "integer", btype: "uint32" },
    sourceTextId: { type: "integer", btype: "uint32" },
    isComposite: { type: "integer", btype: "uint8" },
    reserved8: { type: "integer", btype: "uint8" },
    reserved16: { type: "integer", btype: "uint16" },
  },
})

export const ProjectStateStringValueRecordView = projectStateView.create<ProjectStateStringValueRecord>({
  $id: "ProjectStateStringValueRecord",
  type: "object",
  properties: { valueId: { type: "integer", btype: "uint32" } },
})

export const ProjectStateOwnerTypeRecordView = projectStateView.create<ProjectStateOwnerTypeRecord>({
  $id: "ProjectStateOwnerTypeRecord",
  type: "object",
  properties: {
    kindId: { type: "integer", btype: "uint32" },
    nameId: { type: "integer", btype: "uint32" },
  },
})

export const ProjectStateTableInfoRecordView = projectStateView.create<ProjectStateTableInfoRecord>({
  $id: "ProjectStateTableInfoRecord",
  type: "object",
  properties: {
    ownerTypeId: uint32Field, nameId: uint32Field,
    kind: uint8Field, reserved8: uint8Field, reserved16: uint16Field,
  },
})

export const ProjectStateFormRecordView = projectStateView.create<ProjectStateFormRecord>({
  $id: "ProjectStateFormRecord",
  type: "object",
  properties: {
    sourceFileId: uint32Field, ownerTypeId: uint32Field, nameId: uint32Field,
    tablePathId: uint32Field, typeInfoId: uint32Field, tableInfoId: uint32Field,
    kind: uint8Field, tableHasColumns: uint8Field, reserved: uint16Field,
  },
})

export const ProjectStatePendingCheckRecordView = projectStateView.create<ProjectStatePendingCheckRecord>({
  $id: "ProjectStatePendingCheckRecord",
  type: "object",
  properties: {
    sourceFileId: { type: "integer", btype: "uint32" },
    yamlPathId: { type: "integer", btype: "uint32" },
    line: { type: "integer", btype: "uint32" },
    col: { type: "integer", btype: "uint32" },
    pathId: { type: "integer", btype: "uint32" },
    ownerTypeId: { type: "integer", btype: "uint32" },
    valueId: { type: "integer", btype: "uint32" },
    policyYamlId: { type: "integer", btype: "uint32" },
    allowedKindsStart: { type: "integer", btype: "uint32" },
    allowedKindsCount: { type: "integer", btype: "uint32" },
    elementTypeId: { type: "integer", btype: "uint32" },
    tableContextId: { type: "integer", btype: "uint32" },
    allowComposite: { type: "integer", btype: "uint8" },
    hasValuesPicture: { type: "integer", btype: "uint8" },
    reserved: { type: "integer", btype: "uint16" },
  },
})

export const ProjectStateDependencyRecordView = projectStateView.create<ProjectStateDependencyRecord>({
  $id: "ProjectStateDependencyRecord",
  type: "object",
  properties: {
    sourceFileId: { type: "integer", btype: "uint32" },
    projectPathId: { type: "integer", btype: "uint32" },
  },
})

export const ProjectStateYamlPathRecordView = projectStateView.create<ProjectStateYamlPathRecord>({
  $id: "ProjectStateYamlPathRecord",
  type: "object",
  properties: {
    segmentsStart: { type: "integer", btype: "uint32" },
    segmentsCount: { type: "integer", btype: "uint32" },
  },
})

export const ProjectStateYamlPathSegmentRecordView = projectStateView.create<ProjectStateYamlPathSegmentRecord>({
  $id: "ProjectStateYamlPathSegmentRecord",
  type: "object",
  properties: {
    stringId: uint32Field, numericValue: uint32Field,
    kind: uint8Field, reserved8: uint8Field, reserved16: uint16Field,
  },
})

export const ProjectStateDiagnosticSectionHeaderView =
  projectStateView.create<ProjectStateDiagnosticSectionHeader>({
    $id: "ProjectStateDiagnosticSectionHeader",
    type: "object",
    properties: {
      count: { type: "integer", btype: "uint32" },
      recordsOffset: { type: "integer", btype: "uint32" },
    },
  })

export const ProjectStateDiagnosticRecordView = projectStateView.create<ProjectStateDiagnosticRecord>({
  $id: "ProjectStateDiagnosticRecord",
  type: "object",
  properties: {
    sourceFileId: { type: "integer", btype: "uint32" },
    line: { type: "integer", btype: "uint32" },
    col: { type: "integer", btype: "uint32" },
    messageId: { type: "integer", btype: "uint32" },
    pathId: { type: "integer", btype: "uint32" },
    severity: { type: "integer", btype: "uint8" },
    source: { type: "integer", btype: "uint8" },
    reserved: { type: "integer", btype: "uint16" },
  },
})
