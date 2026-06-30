import { describe, expect, it, vi } from "vitest"
import { listOperationTargets } from "./listOperationTargets"

describe("listOperationTargets service", () => {
  it("passes filters to core", async () => {
    const listMetadataOperationTargets = vi.fn().mockReturnValue({
      ok: true,
      targets: [{ kind: "object", itemTypePrefix: "Справочник", name: "Товары" }],
    })

    const result = await listOperationTargets(
      {
        projectDir: "/project",
        query: "тов",
        kind: "object",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        limit: 10,
      },
      { listMetadataOperationTargets },
    )

    expect(listMetadataOperationTargets).toHaveBeenCalledWith({
      projectDir: "/project",
      query: "тов",
      kind: "object",
      owner: { itemTypePrefix: "Справочник", name: "Товары" },
      limit: 10,
    })
    expect(result).toEqual({
      ok: true,
      targets: [{ kind: "object", itemTypePrefix: "Справочник", name: "Товары" }],
    })
  })
})
