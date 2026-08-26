import { describe, expect, it, vi } from "vitest"

describe("XML anomaly export claim", () => {
  it("доступен между разными экземплярами runtime-модуля", async () => {
    const first = await import("./exportClaim")
    const value = {}
    first.markXmlAnomalyExportClaim(value, "item-1")

    vi.resetModules()
    const second = await import("./exportClaim")

    expect(second.readXmlAnomalyExportClaim(value)).toBe("item-1")
  })
})
