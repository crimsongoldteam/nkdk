import { expect, it } from "vitest"
import { buildBinaryHashIndex, findBinaryHashIndex } from "./hashIndex"

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
