import { describe, expect, it } from "vitest"
import { createMockWorkerThreadPoolFactory } from "./mockWorkerThreadPool"

describe("createMockWorkerThreadPoolFactory", () => {
  it("records commands separately for each mock physical worker", async () => {
    const pools = createMockWorkerThreadPoolFactory(async (command: string) =>
      command.toUpperCase()
    )
    const first = pools.factory()
    const second = pools.factory()

    await expect(first.run("one")).resolves.toBe("ONE")
    await expect(second.run("two")).resolves.toBe("TWO")
    await first.destroy()

    expect(pools.commands(0)).toEqual(["one"])
    expect(pools.commands(1)).toEqual(["two"])
    expect(pools.created()).toBe(2)
    expect(pools.destroyCalls(0)).toBe(1)
  })

  it("destroys a mock physical worker idempotently", async () => {
    const pools = createMockWorkerThreadPoolFactory((command: string) => command)
    const pool = pools.factory()

    await pool.destroy()
    await pool.destroy()

    expect(pools.destroyCalls(0)).toBe(1)
    expect(pools.commands(1)).toEqual([])
  })
})
