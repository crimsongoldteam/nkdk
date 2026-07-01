import { describe, expect, it } from "vitest"
import type { ResolvedDataPathTarget } from "~/metadata/validation/dataPath/resolver"
import { dataPathTargetMatchesCanonicalPrefix, rewriteDataPathSegments } from "./dataPathReferences"

describe("rewriteDataPathSegments", () => {
  it("rewrites only the resolved segment", () => {
    expect(rewriteDataPathSegments("Объект.Товары.Артикул", ["Объект", "Товары", "Артикул"], 2, "Код")).toBe(
      "Объект.Товары.Код",
    )
  })

  it("keeps indexed segments syntax around the changed segment", () => {
    expect(rewriteDataPathSegments("Товары[0].Артикул", ["Товары[0]", "Артикул"], 1, "Код")).toBe("Товары[0].Код")
  })

  it("matches object field DataPath targets by canonical prefix", () => {
    const target: ResolvedDataPathTarget = {
      value: "Объект.Артикул",
      segments: ["Объект", "Артикул"],
      typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "string" },
      source: { kind: "objectField", owner: { kind: "Catalog", name: "Товары" }, name: "Артикул" },
    }

    expect(dataPathTargetMatchesCanonicalPrefix(target, "Catalog.Товары.Attribute.Артикул")).toEqual({
      segmentIndex: 1,
    })
  })
})
