import { describe, expect, it, vi } from "vitest"
import { findReferences } from "./findReferences"

describe("findReferences service", () => {
  it("passes operation path to core without requiring write mode", async () => {
    const coreResult = {
      ok: true,
      mode: "plan",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: [],
    }
    const findMetadataReferences = vi.fn().mockResolvedValue(coreResult)

    const result = await findReferences(
      {
        projectDir: "/project",
        path: "Справочник.Товары",
      },
      { findMetadataReferences }
    )

    expect(findMetadataReferences).toHaveBeenCalledWith({
      projectDir: "/project",
      path: "Справочник.Товары",
    })
    expect(result).toEqual(coreResult)
  })
})
