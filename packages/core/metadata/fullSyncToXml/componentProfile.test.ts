import { describe, expect, it } from "vitest"
import { registerCoreMetadata } from "../register"
import {
  registerFullXmlSyncComponentProfile,
  resolveFullXmlSyncComponentProfile,
} from "./componentProfile"

registerCoreMetadata()

describe("full XML sync component profiles", () => {
  it("resolves configuration and extension profiles", () => {
    expect(resolveFullXmlSyncComponentProfile({ kind: "configuration" }).kind)
      .toBe("configuration")
    const extension = resolveFullXmlSyncComponentProfile({
      kind: "configurationExtension",
      name: "Дополнение",
    })

    expect(extension.kind).toBe("configurationExtension")
    expect(extension.baseAddress({
      kind: "configurationExtension",
      name: "Дополнение",
    })).toEqual({ kind: "configuration" })
  })

  it("rejects duplicate profile registration", () => {
    expect(() =>
      registerFullXmlSyncComponentProfile({
        kind: "configuration",
        supports: () => false,
        baseAddress: () => undefined,
        confirm: () => {
          throw new Error("not used")
        },
      })
    ).toThrow("Профиль XML-синхронизации уже зарегистрирован")
  })

  it("rejects unsupported component kinds", () => {
    expect(() =>
      resolveFullXmlSyncComponentProfile({ kind: "externalReport", name: "Отчёт" })
    ).toThrow("Не найден профиль XML-синхронизации")
  })
})
