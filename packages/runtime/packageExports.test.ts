import { describe, expect, it } from "vitest"

describe("@nkdk/runtime package exports", () => {
  it("exposes only root, rule-kit and worker", async () => {
    const manifest = await import("./package.json", { with: { type: "json" } })
    expect(Object.keys(manifest.default.exports)).toEqual([
      ".",
      "./rule-kit",
      "./worker",
    ])
  })
})
