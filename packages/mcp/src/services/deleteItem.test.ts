import { describe, expect, it, vi } from "vitest"
import { deleteItem } from "./deleteItem"

describe("deleteItem service", () => {
  it("passes operation path to core without requiring write mode", async () => {
    const coreResult = {
      ok: true,
      mode: "plan",
      changedFiles: [],
      rewrittenReferences: [],
      blockedReferences: [],
    }
    const deleteMetadataItem = vi.fn().mockResolvedValue(coreResult)

    const result = await deleteItem(
      {
        projectDir: "/project",
        path: "Справочник.Товары",
      },
      { deleteMetadataItem }
    )

    expect(deleteMetadataItem).toHaveBeenCalledWith({
      projectDir: "/project",
      path: "Справочник.Товары",
      allowWrite: undefined,
    })
    expect(result).toEqual(coreResult)
  })
})
