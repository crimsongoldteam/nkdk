import { expect, it, describe } from "vitest"
import { sortObjectByKeys } from "./sortObjectKeys"

describe("sortObjectByKeys", () => {
  it("should sort keys by given order", () => {
    const obj = { c: 3, a: 1, b: 2 }
    const order = ["a", "b", "c"]
    const result = sortObjectByKeys(obj, order)

    expect(Object.keys(result)).toEqual(["a", "b", "c"])
    expect(result).toEqual({ a: 1, b: 2, c: 3 })
  })

  it("should return original object when order is empty", () => {
    const obj = { c: 3, a: 1, b: 2 }
    const result = sortObjectByKeys(obj, [])

    expect(result).toEqual(obj)
    expect(Object.keys(result)).toEqual(["c", "a", "b"])
  })

  it("should sort keys not in order alphabetically", () => {
    const obj = { z: 3, a: 1, b: 2, y: 4 }
    const order = ["b", "a"]
    const result = sortObjectByKeys(obj, order)

    expect(Object.keys(result)).toEqual(["b", "a", "y", "z"])
    expect(result).toEqual({ b: 2, a: 1, y: 4, z: 3 })
  })

  it("should maintain correct order for partial match", () => {
    const obj = { d: 4, c: 3, a: 1, b: 2, e: 5 }
    const order = ["b", "d", "a"]
    const result = sortObjectByKeys(obj, order)

    expect(Object.keys(result)).toEqual(["b", "d", "a", "c", "e"])
    expect(result).toEqual({ b: 2, d: 4, a: 1, c: 3, e: 5 })
  })

  it("should handle empty object", () => {
    const obj = {}
    const order = ["a", "b", "c"]
    const result = sortObjectByKeys(obj, order)

    expect(Object.keys(result)).toEqual([])
    expect(result).toEqual({})
  })

  it("should work correctly when all keys are in order", () => {
    const obj = { third: 3, first: 1, second: 2 }
    const order = ["first", "second", "third"]
    const result = sortObjectByKeys(obj, order)

    expect(Object.keys(result)).toEqual(["first", "second", "third"])
    expect(result).toEqual({ first: 1, second: 2, third: 3 })
  })

  it("should handle keys not in object but present in order", () => {
    const obj = { b: 2, c: 3 }
    const order = ["a", "b", "c", "d"]
    const result = sortObjectByKeys(obj, order)

    expect(Object.keys(result)).toEqual(["b", "c"])
    expect(result).toEqual({ b: 2, c: 3 })
  })

  it("should preserve object values", () => {
    const obj = { c: { nested: "value" }, a: [1, 2, 3], b: "string" }
    const order = ["a", "b", "c"]
    const result = sortObjectByKeys(obj, order)

    expect(Object.keys(result)).toEqual(["a", "b", "c"])
    expect(result.a).toEqual([1, 2, 3])
    expect(result.b).toEqual("string")
    expect(result.c).toEqual({ nested: "value" })
  })
})
