import { describe, expect, it } from "vitest"

describe("@nkdk/runtime package exports", () => {
  it("exposes only supported entry points", async () => {
    const manifest = await import("./package.json", { with: { type: "json" } })
    expect(Object.keys(manifest.default.exports)).toEqual([
      ".",
      "./configuration-index-store",
      "./rule-kit",
      "./worker",
    ])
  })
})
