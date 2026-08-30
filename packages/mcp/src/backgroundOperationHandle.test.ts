import { describe, expect, it, vi } from "vitest"
import { createBackgroundOperationHandle } from "./backgroundOperationHandle"
import type { BackgroundOperationManager } from "./services/backgroundOperationManager"

describe("background operation handle", () => {
  it("shares one process manager and closes it once", async () => {
    const manager = { close: vi.fn(async () => undefined) }
    const create = vi.fn(() => manager)
    const handle = createBackgroundOperationHandle(
      () => create() as unknown as BackgroundOperationManager,
    )

    expect(await handle.get()).toBe(await handle.get())
    expect(create).toHaveBeenCalledOnce()

    await handle.close()
    await handle.close()
    expect(manager.close).toHaveBeenCalledOnce()
    await expect(handle.get()).rejects.toThrow("закрыт")
  })

  it("does not create a manager only to close an unused handle", async () => {
    const create = vi.fn()
    const handle = createBackgroundOperationHandle(create)

    await handle.close()

    expect(create).not.toHaveBeenCalled()
  })
})
