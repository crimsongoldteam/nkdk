import { expect, it } from "vitest"
import { BinaryStringPoolBuilder, readBinaryString } from "./stringPool"

it("хранит одинаковую UTF-8 строку один раз", () => {
  const builder = new BinaryStringPoolBuilder()
  const first = builder.intern("Справочник.Товары")
  const second = builder.intern("Справочник.Товары")
  const pool = builder.finish()

  expect(first).toBe(second)
  expect(pool.count).toBe(1)
  expect(readBinaryString(pool, first)).toBe("Справочник.Товары")
})

it("принимает готовый хэш и различает коллизию по UTF-8 байтам", () => {
  const builder = new BinaryStringPoolBuilder()
  const encoder = new TextEncoder()
  const first = builder.internBytes(7n, encoder.encode("первая"))
  const second = builder.internBytes(7n, encoder.encode("вторая"))
  const repeated = builder.internBytes(7n, encoder.encode("первая"))
  const pool = builder.finish()

  expect(repeated).toBe(first)
  expect(second).not.toBe(first)
  expect([readBinaryString(pool, first), readBinaryString(pool, second)]).toEqual(["первая", "вторая"])
})
