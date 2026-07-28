import { describe, expect, it, vi } from "vitest"
import { listInfobasesService } from "./listInfobases"

describe("listInfobasesService", () => {
  it("wraps the platform result in a successful payload", async () => {
    const platformResult = {
      tree: [],
      sources: [{ path: "/home/test/.1C/1cestart/ibases.v8i", kind: "personal" as const }],
      warnings: [],
    }
    const listInfobases = vi.fn(async () => platformResult)

    await expect(listInfobasesService({ listInfobases })).resolves.toEqual({
      ok: true,
      ...platformResult,
    })
    expect(listInfobases).toHaveBeenCalledOnce()
  })

  it("converts an unexpected platform error to the common MCP error", async () => {
    const listInfobases = vi.fn(async () => {
      throw new Error("unexpected failure")
    })

    await expect(listInfobasesService({ listInfobases })).resolves.toEqual({
      ok: false,
      code: "core_error",
      message: "unexpected failure",
    })
  })
})
