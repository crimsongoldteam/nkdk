import { describe, expect, it } from "vitest"
import type { ResolvedPropertyStateItemCapability } from "../../ruleRuntime/definition"
import { readPropertyStateSections, writePropertyStateSection } from "../../ruleRuntime/property/propertyStateSections"

const capability: ResolvedPropertyStateItemCapability = {
  itemType: "MetadataXDTOPackage",
  properties: {
    package: {
      availability: "borrowed",
      modes: ["control", "notify", "extend"],
      representation: "section",
      externalName: "Пакет",
    },
    module: {
      availability: "borrowed",
      modes: ["extend"],
      representation: "section",
      externalName: "МодульОбъекта",
    },
    predefined: {
      availability: "borrowed",
      modes: ["extend"],
      representation: "section",
      externalName: "Предопределенные",
    },
  },
}

describe("configuration extension property-state sections", () => {
  it("reads notify and extend by capability external names", () => {
    expect(readPropertyStateSections({
      Проверять: ["Пакет"],
      Изменять: ["МодульОбъекта", "Предопределенные"],
    }, capability)).toEqual(new Map([
      ["package", "notify"],
      ["module", "extend"],
      ["predefined", "extend"],
    ]))
  })

  it("writes canonical section order and capability order", () => {
    const yaml: Record<string, unknown> = { Имя: "Расширение" }
    writePropertyStateSection(yaml, capability, "Предопределенные", "extend")
    writePropertyStateSection(yaml, capability, "Пакет", "notify")
    writePropertyStateSection(yaml, capability, "МодульОбъекта", "extend")

    expect(yaml).toEqual({
      Имя: "Расширение",
      Проверять: ["Пакет"],
      Изменять: ["МодульОбъекта", "Предопределенные"],
    })
  })

  it.each([
    [{ Проверять: ["Пакет"], Изменять: ["Пакет"] }, "одновременно"],
    [{ Проверять: ["МодульОбъекта"] }, "не разрешает режим Проверять"],
    [{ Изменять: ["Неизвестное"] }, "Неизвестное"],
    [{ Изменять: ["Пакет", "Пакет"] }, "повторяется"],
    [{ Изменять: "Пакет" }, "должен быть массивом"],
  ] as const)("rejects invalid section %j", (yaml, message) => {
    expect(() => readPropertyStateSections(yaml, capability)).toThrow(message)
  })
})
