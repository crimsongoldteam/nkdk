import { expect, it } from "vitest"
import {
  BinaryHashSlotRecordView,
  buildBinaryHashIndex,
  findBinaryHashIndex,
  openBinaryHashIndex,
} from "./hashIndex"

it("не принимает коллизию за совпадение ключа", () => {
  const index = buildBinaryHashIndex(
    new BigUint64Array([11n, 11n]),
    new Uint32Array([3, 9]),
  )

  expect(findBinaryHashIndex(index, 11n, (recordId) => recordId === 9)).toBe(9)
  expect(findBinaryHashIndex(index, 11n, () => false)).toBeUndefined()
})

it("держит заполнение не выше 80 процентов", () => {
  const index = buildBinaryHashIndex(
    new BigUint64Array(81).fill(1n),
    Uint32Array.from({ length: 81 }, (_, value) => value),
  )

  expect(index.size / index.capacity).toBeLessThanOrEqual(0.8)
})

it("сохраняет прежний 16-байтовый формат ячейки", () => {
  const index = buildBinaryHashIndex(
    new BigUint64Array([0x0102030405060708n]),
    new Uint32Array([0x0a0b0c0d]),
  )
  const view = new DataView(index.slots)
  const occupiedSlot = Array.from({ length: index.capacity }, (_, slot) => slot)
    .find((slot) => BinaryHashSlotRecordView.decode(
      view,
      slot * BinaryHashSlotRecordView.viewLength,
    ).occupied === 1)

  expect(occupiedSlot).toBeDefined()
  expect(Array.from(new Uint8Array(
    index.slots,
    occupiedSlot! * BinaryHashSlotRecordView.viewLength,
    BinaryHashSlotRecordView.viewLength,
  ))).toEqual([
    0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01,
    0x0d, 0x0c, 0x0b, 0x0a, 0x01, 0x00, 0x00, 0x00,
  ])
})

it("открывает невыровненный встроенный индекс", () => {
  const index = {
    slots: new SharedArrayBuffer(24),
    byteOffset: 8,
    size: 0,
    capacity: 1,
  }

  expect(openBinaryHashIndex(index)).toBe(index)
})

it("отвергает несовпадающие входы и повреждённые границы", () => {
  expect(() => buildBinaryHashIndex(
    new BigUint64Array([1n]),
    new Uint32Array(),
  )).toThrow(/совпад/iu)
  expect(() => openBinaryHashIndex({
    slots: new SharedArrayBuffer(16),
    size: 2,
    capacity: 1,
  })).toThrow()
  expect(() => openBinaryHashIndex({
    slots: new SharedArrayBuffer(16),
    byteOffset: -1,
    size: 0,
    capacity: 1,
  })).toThrow()
  expect(() => openBinaryHashIndex({
    slots: new SharedArrayBuffer(48),
    size: 1,
    capacity: 3,
  })).toThrow()
  expect(() => openBinaryHashIndex({
    slots: new SharedArrayBuffer(16),
    size: 0,
    capacity: 2,
  })).toThrow()
})
