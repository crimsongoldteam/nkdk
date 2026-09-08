import { BinaryRecordBuffer, type ConfigurationIndexBlockFragment } from "@nkdk/runtime"
import { BinaryStringPoolBuilder, openBinaryStringPool, readBinaryString } from "./stringPool"

export interface ImportReconstructionEntity {
  readonly logicalAddress: string
  readonly hasUuid: boolean
  readonly hasIdentity: boolean
}

export interface ImportReconstructionFacts {
  entities(): Iterable<ImportReconstructionEntity>
}

const HEADER_BYTES = 16
const RECORD_BYTES = 8
const MAGIC = 0x31465249
const recordCodec = {
  viewLength: RECORD_BYTES,
  encode(value: { address: number; flags: number }, view: DataView, offset = 0) {
    view.setUint32(offset, value.address, true)
    view.setUint32(offset + 4, value.flags, true)
  },
  decode(view: DataView, offset = 0) {
    return { address: view.getUint32(offset, true), flags: view.getUint32(offset + 4, true) }
  },
}

export function createImportReconstructionFactsWriter() {
  const strings = new BinaryStringPoolBuilder()
  const records = new BinaryRecordBuffer(recordCodec)
  let closed = false
  function assertOpen() {
    if (closed) throw new Error("Накопитель фактов восстановления закрыт")
  }
  return {
    append(fragment: ConfigurationIndexBlockFragment) {
      assertOpen()
      for (const entity of fragment.entities) {
        const hasUuid = entity.uuid !== undefined
        records.append({
          address: strings.intern(entity.logicalAddress),
          flags: hasUuid ? 3 : entity.xmlId !== undefined ? 1 : 0,
        })
      }
    },
    finish(): ArrayBuffer {
      assertOpen()
      closed = true
      try {
        const section = strings.finishSection()
        const buffer = new ArrayBuffer(HEADER_BYTES + section.byteLength + records.byteLength)
        const header = new DataView(buffer)
        header.setUint32(0, MAGIC, true)
        header.setUint32(4, records.length, true)
        header.setUint32(8, section.byteLength, true)
        header.setUint32(12, HEADER_BYTES + section.byteLength, true)
        const bytes = new Uint8Array(buffer)
        bytes.set(new Uint8Array(section), HEADER_BYTES)
        records.copyTo(bytes, HEADER_BYTES + section.byteLength)
        return buffer
      } finally {
        records.clear()
      }
    },
  }
}

export function openImportReconstructionFacts(buffer: ArrayBuffer): ImportReconstructionFacts {
  if (buffer.byteLength < HEADER_BYTES) throw new Error("Оборван профиль восстановления")
  const view = new DataView(buffer)
  const count = view.getUint32(4, true)
  const stringsLength = view.getUint32(8, true)
  const offset = view.getUint32(12, true)
  if (view.getUint32(0, true) !== MAGIC || offset !== HEADER_BYTES + stringsLength
    || offset + count * RECORD_BYTES !== buffer.byteLength) {
    throw new Error("Повреждён профиль восстановления")
  }
  const strings = openBinaryStringPool(buffer, HEADER_BYTES, stringsLength)
  function entity(index: number): ImportReconstructionEntity {
    const record = recordCodec.decode(view, offset + index * RECORD_BYTES)
    if (record.flags !== 0 && record.flags !== 1 && record.flags !== 3) {
      throw new Error("Повреждена идентичность профиля восстановления")
    }
    return {
      logicalAddress: readBinaryString(strings, record.address),
      hasUuid: record.flags === 3,
      hasIdentity: record.flags !== 0,
    }
  }
  for (let index = 0; index < count; index++) entity(index)
  return {
    *entities() { for (let index = 0; index < count; index++) yield entity(index) },
  }
}
