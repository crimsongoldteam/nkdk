import { describe, expect, it, vi } from "vitest"

import { createMetadataRuntimeHandle } from "./metadataRuntimeHandle"

describe("createMetadataRuntimeHandle", () => {
  it("creates one runtime lazily and closes it once", async () => {
    const runtime = { close: vi.fn(async () => undefined) }
    const create = vi.fn(() => runtime)
    const load = vi.fn(async () => ({ create }))
    const handle = createMetadataRuntimeHandle(load)

    expect(load).not.toHaveBeenCalled()
    expect(create).not.toHaveBeenCalled()
    expect(await handle.get()).toBe(await handle.get())
    expect(load).toHaveBeenCalledOnce()
    expect(create).toHaveBeenCalledOnce()

    await handle.close()
    await handle.close()
    expect(runtime.close).toHaveBeenCalledOnce()
  })

  it("does not create a runtime after the handle is closed", async () => {
    const create = vi.fn(() => ({ close: vi.fn(async () => undefined) }))
    const handle = createMetadataRuntimeHandle(async () => ({ create }))

    await handle.close()

    await expect(handle.get()).rejects.toThrow("закрыт")
    expect(create).not.toHaveBeenCalled()
  })
})
