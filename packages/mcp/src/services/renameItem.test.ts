import { describe, expect, it, vi } from "vitest"
import { renameItem } from "./renameItem"

describe("renameItem service", () => {
  it("passes structured target to core", async () => {
    const target = { kind: "object" as const, itemTypePrefix: "Справочник", name: "Товары" }
    const coreResult = {
      ok: true,
      mode: "applied",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: [],
    }
    const renameMetadataItem = vi.fn().mockReturnValue(coreResult)

    const result = await renameItem(
      {
        projectDir: "/project",
        target,
        newName: "Номенклатура",
        allowWrite: true,
      },
      { renameMetadataItem },
    )

    expect(renameMetadataItem).toHaveBeenCalledWith({
      projectDir: "/project",
      target,
      newName: "Номенклатура",
      allowWrite: true,
    })
    expect(result).toEqual(coreResult)
  })
})
