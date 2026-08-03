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
