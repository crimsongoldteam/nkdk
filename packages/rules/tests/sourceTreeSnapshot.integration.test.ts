import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { readSourceTreeOnce } from "./sourceTreeSnapshot"

describe("readSourceTreeOnce", () => {
  it("returns one immutable snapshot per root", () => {
    const fixtureRoot = dirname(fileURLToPath(import.meta.url))

    const first = readSourceTreeOnce(fixtureRoot)
    const second = readSourceTreeOnce(fixtureRoot)

    expect(second).toBe(first)
    expect(Object.isFrozen(first)).toBe(true)
    expect(first.every(Object.isFrozen)).toBe(true)
    expect(first.map((file) => file.relativePath)).toContain("sourceTreeSnapshot.integration.test.ts")
  })
})
