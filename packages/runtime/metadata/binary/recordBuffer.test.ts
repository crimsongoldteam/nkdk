import { expect, it } from "vitest"
import { BinaryRecordBuffer } from "./recordBuffer"

const codec = {
  viewLength: 8,
  encode(value: { left: number; right: number }, view: DataView, offset = 0) {
    view.setUint32(offset, value.left, true)
    view.setUint32(offset + 4, value.right, true)
  },
  decode(view: DataView, offset = 0) {
    return { left: view.getUint32(offset, true), right: view.getUint32(offset + 4, true) }
  },
}

it("пишет записи через границу блока и копирует только занятую часть", () => {
  const buffer = new BinaryRecordBuffer(codec)
  expect(buffer.capacityBytes).toBe(0)
  const value = { left: 7, right: 9 }
  expect(buffer.append(value)).toBe(0)
  value.left = 99
  expect(buffer.read(0)).toEqual({ left: 7, right: 9 })
  for (let i = 1; i < 8500; i++) buffer.append({ left: i, right: i + 1 })
  buffer.write(0, { left: 11, right: 9 })
  expect(buffer.read(8499)).toEqual({ left: 8499, right: 8500 })
  const bytes = new Uint8Array(buffer.byteLength + 8).fill(255)
  expect(buffer.copyTo(bytes, 4)).toBe(68000)
  expect(buffer.capacityBytes).toBe(69632)
  expect(codec.decode(new DataView(bytes.buffer), 4)).toEqual({ left: 11, right: 9 })
  expect([...bytes.subarray(0, 4)]).toEqual([255, 255, 255, 255])
  expect([...bytes.subarray(-4)]).toEqual([255, 255, 255, 255])
  buffer.clear()
  expect(buffer.length).toBe(0)
  expect(buffer.capacityBytes).toBe(0)
  expect(buffer.append({ left: 1, right: 2 })).toBe(0)
})

it("не публикует запись при ошибке кодирования", () => {
  const buffer = new BinaryRecordBuffer({
    ...codec,
    encode(value: { left: number; right: number }, view: DataView, offset = 0) {
      codec.encode(value, view, offset)
      if (value.left === 99) throw new Error("Ошибка записи")
    },
  })
  expect(() => buffer.append({ left: 99, right: 2 })).toThrow("Ошибка записи")
  expect(buffer.length).toBe(0)
  expect(buffer.copyTo(new Uint8Array(0), 0)).toBe(0)
  expect(buffer.append({ left: 1, right: 2 })).toBe(0)
  expect(buffer.read(0)).toEqual({ left: 1, right: 2 })
})

it("проверяет границы до доступа к данным", () => {
  const buffer = new BinaryRecordBuffer(codec)
  buffer.append({ left: 7, right: 9 })
  for (const index of [-1, 0.5, NaN, Infinity, 1]) {
    expect(() => buffer.read(index)).toThrow()
    expect(() => buffer.write(index, { left: 0, right: 0 })).toThrow()
  }
  const target = new Uint8Array(8).fill(255)
  for (const offset of [-1, 0.5, NaN, 1]) expect(() => buffer.copyTo(target, offset)).toThrow()
  expect([...target]).toEqual([255, 255, 255, 255, 255, 255, 255, 255])
  expect(() => new BinaryRecordBuffer({ ...codec, viewLength: 0 })).toThrow()
})
