import type { BinaryHashIndex } from "@nkdk/runtime"
import type { SharedStringPool } from "../validation/sharedStringPool"

export interface FullXmlSyncSharedCompositionSnapshot {
  readonly strings: Pick<SharedStringPool, "buffer" | "count" | "bytes">
  readonly table: SharedArrayBuffer
  readonly childEntryIds: SharedArrayBuffer
  readonly ownerRanges: SharedArrayBuffer
  readonly ownerLookup: BinaryHashIndex
  readonly bytes: number
  readonly assignments: number
}

export interface FullXmlSyncCompositionEntry {
  readonly id: string
  readonly sourceProjectPath: string
  readonly role: "configuration" | "properties" | "form"
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly ownerLogicalAddress?: string
}

export interface FullXmlSyncCompositionChild {
  readonly sourceProjectPath: string
  readonly itemType: string
  readonly itemName: string
  readonly logicalAddress: string
  readonly assignmentRole: "configuration" | "properties" | "fileItem"
  readonly ownerLogicalAddress?: string
}

export interface FullXmlSyncCompositionReader {
  assignment(id: string): FullXmlSyncCompositionEntry | undefined
  children(ownerLogicalAddress: string): readonly FullXmlSyncCompositionChild[]
  itemTypeByYamlDir(): Readonly<Record<string, string>>
}
