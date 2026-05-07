import { describe, expect, it } from "vitest"
import { cypherSet, isCypherSet } from "./cypherPredicate"

describe("cypherSet", () => {
  it("возвращает переданный объект, помеченный брендом", () => {
    const s = cypherSet({
      query: "MATCH (n {id: $scope}) RETURN n.name AS name",
    })
    expect(s.query).toBe("MATCH (n {id: $scope}) RETURN n.name AS name")
  })

  it("isCypherSet возвращает true для результата cypherSet", () => {
    const s = cypherSet({ query: "RETURN 1" })
    expect(isCypherSet(s)).toBe(true)
  })

  it("isCypherSet возвращает false для обычного объекта", () => {
    expect(isCypherSet({ query: "RETURN 1" })).toBe(false)
  })

  it("isCypherSet возвращает false для null/undefined/функции/строки", () => {
    expect(isCypherSet(null)).toBe(false)
    expect(isCypherSet(undefined)).toBe(false)
    expect(isCypherSet(() => true)).toBe(false)
    expect(isCypherSet("hello")).toBe(false)
  })

})
