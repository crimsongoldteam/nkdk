import { describe, expect, it } from "vitest"
import { hasFileChanged } from "./fileStats"

describe("fileStats", () => {
  it("считает файл изменённым при отличии mtimeMs или size", () => {
    expect(hasFileChanged({ path: "a", mtimeMs: 1, size: 2, updatedAt: 3 }, { mtimeMs: 1, size: 2 })).toBe(false)
    expect(hasFileChanged({ path: "a", mtimeMs: 1, size: 2, updatedAt: 3 }, { mtimeMs: 9, size: 2 })).toBe(true)
    expect(hasFileChanged({ path: "a", mtimeMs: 1, size: 2, updatedAt: 3 }, { mtimeMs: 1, size: 9 })).toBe(true)
  })
})
