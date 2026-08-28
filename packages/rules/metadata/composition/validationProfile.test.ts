import { createConfigurationLanguages } from "@nkdk/runtime"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"

import { createValidationProfileRuntime } from "./validationProfile"
import type { ProjectStateService } from "../projectState/service"

describe("createValidationProfileRuntime", () => {
  it("передаёт реестр языков и его версию в compiled validation", async () => {
    const languages = createConfigurationLanguages({
      default: "ru",
      registered: ["ru", "en"],
    })
    const staleLanguages = createConfigurationLanguages({
      default: "ru",
      registered: ["ru"],
    })
    const loadLanguages = vi.fn(async () => languages)
    const refreshAndValidate = vi.fn(async () => ({
      diagnostics: [],
      files: [],
    }))
    const runtime = createValidationProfileRuntime({ loadLanguages })

    try {
      await runtime.refreshAndValidate(
        { refreshAndValidate } as unknown as ProjectStateService,
        { projectDir: "/project", context: { version: "2.20", languages: staleLanguages } },
      )
    } finally {
      await runtime.close()
    }

    expect(loadLanguages).toHaveBeenCalledWith(join("/project", "cf"))
    expect(refreshAndValidate).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({ languages }),
      validationContextVersions: new Map([["languages", languages.version]]),
    }))
  })
})
