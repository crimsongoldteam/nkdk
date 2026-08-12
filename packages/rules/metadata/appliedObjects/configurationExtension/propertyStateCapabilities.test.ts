import { describe, expect, it } from "vitest"

import type { PropertyStateCapabilityContribution } from "../../ruleRuntime/definition"
import { createPropertyStateCapabilityRegistry } from "./propertyStateCapabilities"

describe("PropertyState capability registry", () => {
  it("накладывает профили, отличие вида и подходящие версионные дельты", () => {
    const contributions: PropertyStateCapabilityContribution[] = [
      {
        kind: "propertyStateCapability",
        id: "base",
        profile: {
          properties: {
            value: { availability: "borrowed", modes: ["control"] },
            onlyExtend: { availability: "borrowed", modes: ["extend"], representation: "plain" },
          },
        },
      },
      {
        kind: "propertyStateCapability",
        id: "sample",
        item: {
          itemType: "Sample",
          profiles: ["base"],
          properties: { value: { availability: "borrowed", modes: ["control", "notify"] } },
        },
      },
      {
        kind: "propertyStateCapability",
        id: "sample-8.3.18",
        delta: {
          mode: "Версия8_3_18",
          items: [{ itemType: "Sample", properties: { value: { modes: ["control", "notify", "extend"] } } }],
        },
      },
    ]
    const registry = createPropertyStateCapabilityRegistry(contributions)

    expect(registry.resolve({ itemType: "Sample", propertyKey: "value", compatibilityMode: "Версия8_3_17" })).toEqual({
      availability: "borrowed",
      modes: ["control", "notify"],
    })
    expect(registry.resolve({ itemType: "Sample", propertyKey: "value", compatibilityMode: "Версия8_3_18" })?.modes).toEqual([
      "control",
      "notify",
      "extend",
    ])
    expect(registry.resolve({ itemType: "Sample", propertyKey: "onlyExtend", compatibilityMode: "Версия8_3_27" })).toEqual({
      availability: "borrowed",
      modes: ["extend"],
      representation: "plain",
    })
  })

  it.each(["НеИспользовать", "DontUse", undefined] as const)("использует матрицу 8.3.27 для %s", (mode) => {
    const registry = createPropertyStateCapabilityRegistry([
      {
        kind: "propertyStateCapability",
        id: "sample",
        item: { itemType: "Sample", profiles: [], properties: { value: { availability: "borrowed", modes: ["control"] } } },
      },
      {
        kind: "propertyStateCapability",
        id: "latest",
        delta: { mode: "Версия8_3_27", items: [{ itemType: "Sample", properties: { value: { modes: ["extend"] } } }] },
      },
    ])

    expect(registry.resolve({ itemType: "Sample", propertyKey: "value", compatibilityMode: mode })?.modes).toEqual(["extend"])
  })

  it("отклоняет повторный id", () => {
    const duplicate = { kind: "propertyStateCapability" as const, id: "same", profile: { properties: {} } }

    expect(() => createPropertyStateCapabilityRegistry([duplicate, duplicate])).toThrow("same")
  })

  it("отклоняет неизвестный режим совместимости расширения", () => {
    const registry = createPropertyStateCapabilityRegistry([])

    expect(() => registry.item("Sample", "Версия8_3_99")).toThrow(
      "Неизвестный РежимСовместимостиРасширенияКонфигурации: Версия8_3_99",
    )
  })
})
