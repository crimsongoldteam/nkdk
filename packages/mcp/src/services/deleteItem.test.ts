import { describe, expect, it, vi } from "vitest"
import { deleteItem } from "./deleteItem"

describe("deleteItem service", () => {
  it("passes structured target to core without requiring write mode", async () => {
    const target = {
      kind: "attribute" as const,
      owner: { itemTypePrefix: "Справочник", name: "Товары" },
      name: "Артикул",
    }
    const coreResult = {
      ok: true,
      mode: "plan",
      changedFiles: ["Справочник/Товары/Свойства.yaml"],
      rewrittenReferences: [],
      blockedReferences: [],
    }
    const deleteMetadataItem = vi.fn().mockReturnValue(coreResult)

    const result = await deleteItem(
      {
        projectDir: "/project",
        target,
      },
      { deleteMetadataItem },
    )

    expect(deleteMetadataItem).toHaveBeenCalledWith({
      projectDir: "/project",
      target,
      allowWrite: undefined,
    })
    expect(result).toEqual(coreResult)
  })
})
