import { describe, expect, it } from "vitest"
import { CypherCache } from "./cypherCache"

describe("CypherCache", () => {
  it("возвращает undefined для несуществующего ключа", () => {
    const cache = new CypherCache()
    expect(cache.get("key")).toBeUndefined()
  })

  it("возвращает сохранённые строки", () => {
    const cache = new CypherCache()
    const rows = [{ name: "ДинамическийСписок1" }]
    cache.set("key", rows)
    expect(cache.get("key")).toBe(rows)
  })

  it("перезаписывает по тому же ключу", () => {
    const cache = new CypherCache()
    cache.set("key", [{ a: 1 }])
    cache.set("key", [{ a: 2 }])
    expect(cache.get("key")).toEqual([{ a: 2 }])
  })

  it("хранит значения по разным ключам независимо", () => {
    const cache = new CypherCache()
    cache.set("k1", [{ x: 1 }])
    cache.set("k2", [{ x: 2 }])
    expect(cache.get("k1")).toEqual([{ x: 1 }])
    expect(cache.get("k2")).toEqual([{ x: 2 }])
  })

  it("принимает пустой массив строк", () => {
    const cache = new CypherCache()
    cache.set("empty", [])
    expect(cache.get("empty")).toEqual([])
  })
})
