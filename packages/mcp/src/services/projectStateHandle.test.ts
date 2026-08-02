import { describe, expect, it, vi } from "vitest"
import type { CoreApi, CoreProjectStateService } from "../coreApi"
import { createProjectStateHandle } from "./projectStateHandle"

describe("ProjectStateHandle", () => {
  it("лениво создаёт одно состояние и безопасно закрывает его один раз", async () => {
    const close = vi.fn(async () => undefined)
    const service = { close } as unknown as CoreProjectStateService
    const createProjectStateService = vi.fn(() => service)
    const loadCore = vi.fn(async () => ({ createProjectStateService }) as unknown as CoreApi)
    const handle = createProjectStateHandle(loadCore)

    expect(loadCore).not.toHaveBeenCalled()

    await expect(Promise.all([handle.get(), handle.get()])).resolves.toEqual([service, service])
    await handle.close()
    await handle.close()

    expect(loadCore).toHaveBeenCalledOnce()
    expect(createProjectStateService).toHaveBeenCalledOnce()
    expect(close).toHaveBeenCalledOnce()
    await expect(handle.get()).rejects.toThrow("ProjectState handle закрыт")
  })

  it("не загружает core при закрытии до первого обращения", async () => {
    const loadCore = vi.fn<() => Promise<CoreApi>>()
    const handle = createProjectStateHandle(loadCore)

    await handle.close()

    expect(loadCore).not.toHaveBeenCalled()
  })
})
