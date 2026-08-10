import { describe, expect, it } from "vitest"
import { ensureCoreMetadataRegistered, type CoreMetadataSetupState } from "./coreMetadataSetup"

describe("core metadata test setup", () => {
  it("загружает и регистрирует metadata один раз для повторных setup-вызовов", async () => {
    const state: CoreMetadataSetupState = {}
    let loads = 0
    let registrations = 0
    const load = async () => {
      loads += 1
      return {
        registerCoreMetadata() {
          registrations += 1
        },
      }
    }

    await Promise.all([
      ensureCoreMetadataRegistered({ state, load }),
      ensureCoreMetadataRegistered({ state, load }),
    ])
    await ensureCoreMetadataRegistered({ state, load })

    expect({ loads, registrations }).toEqual({ loads: 1, registrations: 1 })
  })

  it("сохраняет первую ошибку загрузки без повторной регистрации", async () => {
    const state: CoreMetadataSetupState = {}
    const failure = new Error("metadata load failed")
    let loads = 0
    const load = async () => {
      loads += 1
      throw failure
    }

    await expect(ensureCoreMetadataRegistered({ state, load })).rejects.toBe(failure)
    await expect(ensureCoreMetadataRegistered({ state, load })).rejects.toBe(failure)
    expect(loads).toBe(1)
  })
})
