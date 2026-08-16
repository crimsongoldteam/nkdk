import { describe, expect, it, vi } from "vitest"
import { createShutdownCoordinator } from "./shutdown"

describe("shutdown coordinator", () => {
  it("выполняет все ветви один раз при параллельных вызовах", async () => {
    const first = vi.fn(async () => {})
    const second = vi.fn(async () => {})
    const coordinator = createShutdownCoordinator([first, second])

    const left = coordinator.shutdown()
    const right = coordinator.shutdown()

    expect(left).toBe(right)
    await Promise.all([left, right])
    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it("дожидается всех ветвей и возвращает первую ошибку", async () => {
    const order: string[] = []
    const firstError = new Error("first")
    const coordinator = createShutdownCoordinator([
      async () => {
        order.push("first")
        throw firstError
      },
      async () => {
        await Promise.resolve()
        order.push("second")
        throw new Error("second")
      },
      async () => {
        order.push("third")
      },
    ])

    await expect(coordinator.shutdown()).rejects.toBe(firstError)
    expect(order).toEqual(expect.arrayContaining(["first", "second", "third"]))
  })
})
