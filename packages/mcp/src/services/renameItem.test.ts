import { describe, expect, it, vi } from "vitest"
import { renameItem } from "./renameItem"

describe("renameItem service", () => {
  it("passes operation path to core", async () => {
    const coreResult = {
      ok: true,
      mode: "applied",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: [],
    }
    const renameMetadataItem = vi.fn().mockResolvedValue(coreResult)

    const result = await renameItem(
      {
        projectDir: "/project",
        path: "Справочник.Товары",
        newName: "Номенклатура",
        allowWrite: true,
      },
      { renameMetadataItem },
    )

    expect(renameMetadataItem).toHaveBeenCalledWith({
      projectDir: "/project",
      path: "Справочник.Товары",
      newName: "Номенклатура",
      allowWrite: true,
    })
    expect(result).toEqual(coreResult)
  })
})
