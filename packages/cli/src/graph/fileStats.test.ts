import { describe, expect, it } from "vitest"
import { hasFileChanged } from "./fileStats"

describe("fileStats", () => {
  it("считает файл изменённым при отличии mtimeMs или size", () => {
    expect(hasFileChanged({ path: "a", mtimeMs: 1, size: 2, updatedAt: 3 }, { mtimeMs: 1, size: 2 })).toBe(false)
    expect(hasFileChanged({ path: "a", mtimeMs: 1, size: 2, updatedAt: 3 }, { mtimeMs: 9, size: 2 })).toBe(true)
    expect(hasFileChanged({ path: "a", mtimeMs: 1, size: 2, updatedAt: 3 }, { mtimeMs: 1, size: 9 })).toBe(true)
  })

  it("не считает файл изменённым из-за дробной точности FalkorDB", () => {
    expect(hasFileChanged(
      { path: "a", mtimeMs: 1777270778095.49, size: 44171, updatedAt: 3 },
      { mtimeMs: 1777270778095.4863, size: 44171 },
    )).toBe(false)
    expect(hasFileChanged(
      { path: "a", mtimeMs: 1777270781936.5, size: 5346, updatedAt: 3 },
      { mtimeMs: 1777270781936, size: 5346 },
    )).toBe(false)
  })
})
