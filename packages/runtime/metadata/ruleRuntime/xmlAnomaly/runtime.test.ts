import { describe, expect, it } from "vitest"

import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import type { MetadataItemRule } from "../property/types"
import type { XmlCompactRawRegistration } from "./contracts"
import { createXmlAnomalyRegistry } from "./registry"
import { createXmlAnomalyRuntime } from "./runtime"

const itemRule: MetadataItemRule = {
  itemType: "SyntheticOwner",
  properties: {
    transport: { type: "SyntheticTransport", yaml: "Транспорт" },
    settings: {
      type: "SyntheticSettings",
      yaml: "Настройки",
      itemRule: {
        itemType: "SyntheticSettingsItem",
        properties: {
          mode: { type: "string", yaml: "Режим" },
        },
      },
    },
  },
}

describe("XmlAnomalyRuntime", () => {
  it("дважды проверяет генератор на одном замороженном input и кэширует результат", () => {
    let calls = 0
    let firstInputs: Readonly<Record<string, unknown>> | undefined
    const registration: XmlCompactRawRegistration = {
      kind: "compactRaw",
      boundary: { itemType: "SyntheticOwner", propertyKey: "transport" },
      inputs: [{ name: "mode", propertyPath: ["settings", "mode"] }],
      generate: (inputs) => {
        calls += 1
        firstInputs ??= inputs
        expect(inputs).toBe(firstInputs)
        expect(Object.isFrozen(inputs)).toBe(true)
        return parseXmlDocumentWithSaxes(
          `<Transport mode="${String(inputs.mode)}"/>`,
        ).roots
      },
    }
    const runtime = createXmlAnomalyRuntime(
      createXmlAnomalyRegistry([registration]),
    )
    const params = {
      rule: itemRule,
      propertyKey: "transport",
      yaml: { Настройки: { Режим: "strict" } },
    }

    const first = runtime.generateCompactRaw(params)
    const second = runtime.generateCompactRaw(params)

    expect(first?.map(({ name }) => name)).toEqual(["Transport"])
    expect(second).toBe(first)
    expect(calls).toBe(2)
  })

  it("блокирует регистрацию после недетерминированного результата", () => {
    let calls = 0
    const registration: XmlCompactRawRegistration = {
      kind: "compactRaw",
      boundary: { propertyType: "SyntheticTransport" },
      inputs: [],
      generate: () => parseXmlDocumentWithSaxes(
        `<Transport call="${++calls}"/>`,
      ).roots,
    }
    const runtime = createXmlAnomalyRuntime(
      createXmlAnomalyRegistry([registration]),
    )
    const params = { rule: itemRule, propertyKey: "transport", yaml: {} }

    expect(() => runtime.generateCompactRaw(params)).toThrow(/недетерминирован/i)
    expect(() => runtime.generateCompactRaw(params)).toThrow(/заблокирован/i)
    expect(calls).toBe(2)
  })

  it("не запускает генератор без объявленного входа PropertyRule", () => {
    let calls = 0
    const registration: XmlCompactRawRegistration = {
      kind: "compactRaw",
      boundary: { propertyType: "SyntheticTransport" },
      inputs: [{ name: "mode", propertyPath: ["settings", "mode"] }],
      generate: () => {
        calls += 1
        return []
      },
    }
    const runtime = createXmlAnomalyRuntime(
      createXmlAnomalyRegistry([registration]),
    )

    expect(() => runtime.generateCompactRaw({
      rule: itemRule,
      propertyKey: "transport",
      yaml: { Настройки: {} },
    })).toThrow(/не найден.*settings\.mode/i)
    expect(calls).toBe(0)
  })

  it("различает обязательный important и скрытое имя singleton", () => {
    const runtime = createXmlAnomalyRuntime(createXmlAnomalyRegistry([
      {
        kind: "important",
        boundary: { propertyType: "SyntheticTransport" },
      },
      {
        kind: "hiddenSingletonName",
        boundary: { itemType: "SyntheticOwner", propertyKey: "settings" },
      },
    ]))

    expect(runtime.requiresImportant({
      itemType: "SyntheticOwner",
      propertyKey: "transport",
      propertyType: "SyntheticTransport",
    })).toBe(true)
    expect(runtime.allowsHiddenSingletonName({
      itemType: "SyntheticOwner",
      propertyKey: "settings",
      propertyType: "SyntheticSettings",
    })).toBe(true)
    expect(runtime.requiresImportant({
      itemType: "SyntheticOwner",
      propertyKey: "settings",
      propertyType: "SyntheticSettings",
    })).toBe(false)
  })
})
