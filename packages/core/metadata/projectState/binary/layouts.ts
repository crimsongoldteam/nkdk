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
