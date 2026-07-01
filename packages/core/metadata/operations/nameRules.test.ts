import { describe, expect, it } from "vitest"
import { hasCaseInsensitiveConflict, validateMetadataLocalName } from "./nameRules"

describe("metadata operation name rules", () => {
  it("validates local metadata names", () => {
    expect(validateMetadataLocalName("Артикул")).toEqual({ ok: true })
    expect(validateMetadataLocalName("Некорректное имя")).toMatchObject({ ok: false })
    expect(validateMetadataLocalName("Товары.Артикул")).toMatchObject({ ok: false })
  })

  it("allows case-only rename but blocks sibling conflicts case-insensitively", () => {
    expect(
      hasCaseInsensitiveConflict({
        existingNames: ["Артикул", "Код"],
        currentName: "Артикул",
        nextName: "артикул",
      }),
    ).toBe(false)
    expect(
      hasCaseInsensitiveConflict({
        existingNames: ["Артикул", "Код"],
        currentName: "Артикул",
        nextName: "код",
      }),
    ).toBe(true)
  })
})
