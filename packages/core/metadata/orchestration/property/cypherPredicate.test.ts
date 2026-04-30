import { describe, expect, it } from "vitest"
import { cypherPredicate, isCypherPredicate } from "./cypherPredicate"

describe("cypherPredicate", () => {
  it("возвращает переданный объект, помеченный брендом", () => {
    const pred = cypherPredicate({
      query: "MATCH (n {id: $scope}) RETURN n",
      test: () => true,
    })
    expect(pred.query).toBe("MATCH (n {id: $scope}) RETURN n")
    expect(pred.test({}, [])).toBe(true)
  })

  it("isCypherPredicate возвращает true для результата cypherPredicate", () => {
    const pred = cypherPredicate({
      query: "RETURN 1",
      test: () => false,
    })
    expect(isCypherPredicate(pred)).toBe(true)
  })

  it("isCypherPredicate возвращает false для обычного объекта", () => {
    expect(isCypherPredicate({ query: "RETURN 1", test: () => false })).toBe(false)
  })

  it("isCypherPredicate возвращает false для null/undefined/функции/строки", () => {
    expect(isCypherPredicate(null)).toBe(false)
    expect(isCypherPredicate(undefined)).toBe(false)
    expect(isCypherPredicate(() => true)).toBe(false)
    expect(isCypherPredicate("hello")).toBe(false)
  })
})
