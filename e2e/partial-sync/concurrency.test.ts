import { describe, expect, it } from "vitest"
import {
  resolveConcurrency,
  runModeJobsWithConcurrency,
  runWithConcurrency,
} from "./concurrency"

describe("stepwise concurrency", () => {
  it("ограничивает auto двумя процессами", () => {
    expect(resolveConcurrency({
      total: "auto",
      designerAgent: "auto",
      standaloneServer: "auto",
    }, {
      cpuCount: 32,
      availableMemoryBytes: 64 * 1024 ** 3,
    })).toEqual({ total: 2, designerAgent: 2, standaloneServer: 2 })
  })

  it("учитывает малое количество доступной памяти", () => {
    expect(resolveConcurrency({
      total: "auto",
      designerAgent: "auto",
      standaloneServer: "auto",
    }, {
      cpuCount: 8,
      availableMemoryBytes: 1_500_000_000,
    }).total).toBe(1)
  })

  it("продолжает очередь после ошибки и сохраняет порядок результатов", async () => {
    const result = await runWithConcurrency(["a", "b", "c"], 2, async (key) => {
      if (key === "a") throw new Error("planned")
      return key
    })

    expect(result.map(({ status }) => status)).toEqual(["failed", "succeeded", "succeeded"])
  })

  it("соблюдает общий и режимные пределы", async () => {
    const running = { total: 0, designer: 0, standalone: 0 }
    const maximum = { ...running }
    const jobs = [
      { mode: "designer-agent" as const, id: "d1" },
      { mode: "designer-agent" as const, id: "d2" },
      { mode: "standalone-server" as const, id: "s1" },
      { mode: "standalone-server" as const, id: "s2" },
    ]

    await runModeJobsWithConcurrency(jobs, {
      total: 2, designerAgent: 1, standaloneServer: 1,
    }, async ({ mode }) => {
      running.total += 1
      running[mode === "designer-agent" ? "designer" : "standalone"] += 1
      maximum.total = Math.max(maximum.total, running.total)
      maximum.designer = Math.max(maximum.designer, running.designer)
      maximum.standalone = Math.max(maximum.standalone, running.standalone)
      await Promise.resolve()
      running.total -= 1
      running[mode === "designer-agent" ? "designer" : "standalone"] -= 1
    })

    expect(maximum).toEqual({ total: 2, designer: 1, standalone: 1 })
  })
})
