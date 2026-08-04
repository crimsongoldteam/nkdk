import { expect, it } from "vitest"
import { BinaryStringPoolBuilder } from "./stringPool"
import { decodeBinaryValue, encodeBinaryValue } from "./valueCodec"

it("кодирует вложенное значение без JSON", () => {
  const strings = new BinaryStringPoolBuilder()
  const encoded = encodeBinaryValue(
    { kinds: ["object"], nullable: false, count: 2 },
    strings,
  )
  const pool = strings.finish()

  expect(decodeBinaryValue(encoded, pool)).toEqual({
    kinds: ["object"],
    nullable: false,
    count: 2,
  })
  expect(new TextDecoder().decode(encoded)).not.toContain("kinds")
})

it("восстанавливает bigint за пределами 64 бит", () => {
  const strings = new BinaryStringPoolBuilder()
  const value = -(1n << 100n)
  const encoded = encodeBinaryValue(value, strings)

  expect(decodeBinaryValue(encoded, strings.finish())).toBe(value)
})

it("восстанавливает __proto__ как обычное поле объекта", () => {
  const value: Record<string, unknown> = {}
  Object.defineProperty(value, "__proto__", {
    value: "данные",
    enumerable: true,
  })
  const strings = new BinaryStringPoolBuilder()
  const encoded = encodeBinaryValue(value, strings)
  const decoded = decodeBinaryValue(encoded, strings.finish())

  expect(Object.getPrototypeOf(decoded)).toBe(Object.prototype)
  expect(Object.hasOwn(decoded as object, "__proto__")).toBe(true)
  expect((decoded as Record<string, unknown>)["__proto__"]).toBe("данные")
})
