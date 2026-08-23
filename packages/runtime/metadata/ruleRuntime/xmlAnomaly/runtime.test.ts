import { describe, expect, it } from "vitest"

import { parseXmlDocumentWithSaxes } from "../../../xml/import/saxesParser"
import type { MetadataItemRule } from "../property/types"
import type { XmlCompactRawRegistration } from "./contracts"
import { createXmlAnomalyRegistry } from "./registry"
import {
  createXmlAnomalyRuntime,
  type XmlAnomalyRuntime,
  type XmlAnomalyRuntimeDependencies,
} from "./runtime"

const itemRule: MetadataItemRule = {
  itemType: "SyntheticOwner",
  properties: {
    transport: {
      type: "SyntheticTransport",
      yaml: "Транспорт",
      standartAttributeNames: {
        reference: "Ссылка",
        code: "Код",
      },
    },
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

const standardIndexInputs: XmlCompactRawRegistration["inputs"] = [
  {
    name: "ownerType",
    source: { kind: "owner", projection: "itemType" },
  },
  {
    name: "indexValue",
    source: {
      kind: "standardIndex",
      index: "standardAttributes",
      keyInputs: ["ownerType"],
    },
  },
]

const yamlModeInput: XmlCompactRawRegistration["inputs"] = [{
  name: "mode",
  source: { kind: "yamlProperty", propertyPath: ["settings", "mode"] },
}]

function propertyTypeRegistration(
  inputs: XmlCompactRawRegistration["inputs"],
  generate: XmlCompactRawRegistration["generate"],
): XmlCompactRawRegistration {
  return {
    kind: "compactRaw",
    boundary: { propertyType: "SyntheticTransport" },
    inputs,
    generate,
  }
}

function anomalyRuntime(
  registration: XmlCompactRawRegistration,
  dependencies?: XmlAnomalyRuntimeDependencies,
) {
  return createXmlAnomalyRuntime(
    createXmlAnomalyRegistry([registration]),
    dependencies,
  )
}

function transportParams(yaml: unknown = {}) {
  return { rule: itemRule, propertyKey: "transport", yaml }
}

function expectNondeterminismBlocked(
  runtime: XmlAnomalyRuntime,
  calls: () => number,
): void {
  const params = transportParams()
  expect(() => runtime.generateCompactRaw(params)).toThrow(/недетерминирован/i)
  expect(() => runtime.generateCompactRaw(params)).toThrow(/заблокирован/i)
  expect(calls()).toBe(2)
}

function unexpectedGenerator(): never {
  throw new Error("Генератор не должен запускаться")
}

describe("XmlAnomalyRuntime", () => {
  it("дважды проверяет генератор на одном замороженном input и кэширует результат", () => {
    let calls = 0
    let firstInputs: Readonly<Record<string, unknown>> | undefined
    const registration: XmlCompactRawRegistration = {
      kind: "compactRaw",
      boundary: { itemType: "SyntheticOwner", propertyKey: "transport" },
      inputs: [{
        name: "mode",
        source: { kind: "yamlProperty", propertyPath: ["settings", "mode"] },
      }],
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
    const runtime = anomalyRuntime(registration)
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
    const registration = propertyTypeRegistration(
      [],
      () => parseXmlDocumentWithSaxes(
        `<Transport call="${++calls}"/>`,
      ).roots,
    )
    const runtime = anomalyRuntime(registration)
    expectNondeterminismBlocked(runtime, () => calls)
  })

  it("не принимает разные XML-деревья с искусственно одинаковым structuralHash", () => {
    let calls = 0
    const registration = propertyTypeRegistration([], () => {
      const root = parseXmlDocumentWithSaxes(
        `<Transport call="${++calls}"/>`,
      ).roots[0]
      if (root === undefined) throw new Error("Не построен тестовый XML")
      return [{ ...root, structuralHash: 1n }]
    })
    const runtime = anomalyRuntime(registration)
    expectNondeterminismBlocked(runtime, () => calls)
  })

  it("не блокирует регистрацию без обычного YAML input", () => {
    let generatorCalls = 0
    const registration = propertyTypeRegistration(
      yamlModeInput,
      (inputs) => {
        generatorCalls += 1
        return parseXmlDocumentWithSaxes(
          `<Transport mode="${String(inputs.mode)}"/>`,
        ).roots
      },
    )
    const runtime = anomalyRuntime(registration)

    expect(() => runtime.generateCompactRaw({
      rule: itemRule,
      propertyKey: "transport",
      yaml: { Настройки: {} },
    })).toThrow(/не найден.*settings\.mode/i)
    expect(runtime.generateCompactRaw(transportParams({
      Настройки: { Режим: "strict" },
    }))?.[0]?.attributes[0]?.value).toBe("strict")
    expect(generatorCalls).toBe(2)
  })

  it.each(["корневом", "вложенном"])(
    "не выполняет YAML getter на %s уровне yamlProperty path",
    (level) => {
      let targetGetterCalls = 0
      let unrelatedGetterCalls = 0
      const settings: Record<string, unknown> = {}
      const yaml: Record<string, unknown> = {}
      Object.defineProperty(settings, "Несвязанный", {
        enumerable: true,
        get: () => {
          unrelatedGetterCalls += 1
          return "unrelated"
        },
      })
      Object.defineProperty(yaml, "Несвязанный", {
        enumerable: true,
        get: () => {
          unrelatedGetterCalls += 1
          return "unrelated"
        },
      })
      const target = {
        enumerable: true,
        get: () => {
          targetGetterCalls += 1
          return level === "корневом" ? settings : "strict"
        },
      }
      if (level === "корневом") {
        Object.defineProperty(yaml, "Настройки", target)
        settings.Режим = "strict"
      } else {
        yaml.Настройки = settings
        Object.defineProperty(settings, "Режим", target)
      }
      const runtime = anomalyRuntime(propertyTypeRegistration(
        yamlModeInput,
        unexpectedGenerator,
      ))

      expect(() => runtime.generateCompactRaw(transportParams(yaml))).toThrow(
        /YAML.*data descriptor/i,
      )
      expect(targetGetterCalls).toBe(0)
      expect(unrelatedGetterCalls).toBe(0)
    },
  )

  it("не смешивает разрешённые plain-data inputs в ключе кэша", () => {
    let calls = 0
    const registration = propertyTypeRegistration(yamlModeInput, (inputs) => {
      calls += 1
      const value = inputs.mode
      const label = typeof value === "number"
        ? Number.isNaN(value)
          ? "nan"
          : value === Infinity
            ? "positive-infinity"
            : value === -Infinity
              ? "negative-infinity"
              : Object.is(value, -0)
                ? "negative-zero"
                : "positive-zero"
        : Object.keys(value as Readonly<Record<string, unknown>>).join("-")
      return parseXmlDocumentWithSaxes(`<Transport mode="${label}"/>`).roots
    })
    const runtime = anomalyRuntime(registration)
    const generate = (mode: unknown) => runtime.generateCompactRaw({
      rule: itemRule,
      propertyKey: "transport",
      yaml: { Настройки: { Режим: mode } },
    })?.[0]?.attributes[0]?.value

    expect([
      generate(+0),
      generate(-0),
      generate(NaN),
      generate(Infinity),
      generate(-Infinity),
      generate({ first: 1, second: 2 }),
      generate({ second: 2, first: 1 }),
    ]).toEqual([
      "positive-zero",
      "negative-zero",
      "nan",
      "positive-infinity",
      "negative-infinity",
      "first-second",
      "second-first",
    ])
    expect(calls).toBe(14)
  })

  it.each([
    ["Date", () => new Date(0)],
    ["Map", () => new Map([["key", "value"]])],
    ["custom prototype", () => Object.assign(Object.create({ inherited: true }), { value: "x" })],
    ["function", () => () => "value"],
    ["symbol", () => Symbol("value")],
    ["undefined", () => undefined],
    ["array accessor", () => {
      const value = ["visible"]
      Object.defineProperty(value, 0, {
        enumerable: true,
        get: () => "hidden",
      })
      return value
    }],
    ["array hidden field", () => {
      const value = ["visible"]
      Object.defineProperty(value, "hidden", {
        value: "hidden",
      })
      return value
    }],
    ["cycle", () => {
      const value: Record<string, unknown> = {}
      value.self = value
      return value
    }],
  ])("отклоняет %s вне plain-data домена inputs", (_name, createValue) => {
    const registration = propertyTypeRegistration(
      yamlModeInput,
      unexpectedGenerator,
    )
    const runtime = anomalyRuntime(registration)

    expect(() => runtime.generateCompactRaw({
      rule: itemRule,
      propertyKey: "transport",
      yaml: { Настройки: { Режим: createValue() } },
    })).toThrow(/plain-data/i)
  })

  it.each([
    ["чтении", (inputs: Readonly<Record<string, unknown>>) => inputs.hidden],
    ["проверке наличия", (inputs: Readonly<Record<string, unknown>>) => "hidden" in inputs],
  ])("блокирует генератор при %s необъявленного input", (_name, access) => {
    let calls = 0
    const registration = propertyTypeRegistration([], (inputs) => {
      calls += 1
      access(inputs)
      return []
    })
    const runtime = anomalyRuntime(registration)
    const params = transportParams()

    expect(() => runtime.generateCompactRaw(params)).toThrow(/необъявлен.*hidden/i)
    expect(() => runtime.generateCompactRaw(params)).toThrow(/заблокирован/i)
    expect(calls).toBe(1)
  })

  it("строит compact raw из owner и безопасной PropertyRule projection", () => {
    const registration: XmlCompactRawRegistration = {
      kind: "compactRaw",
      boundary: { itemType: "SyntheticOwner", propertyKey: "transport" },
      inputs: [
        {
          name: "ownerType",
          source: { kind: "owner", projection: "itemType" },
        },
        {
          name: "attributeNames",
          source: {
            kind: "propertyRule",
            fieldPath: ["standartAttributeNames"],
          },
        },
      ],
      generate: (inputs) => {
        const attributeNames = inputs.attributeNames
        if (
          typeof attributeNames !== "object" ||
          attributeNames === null ||
          Array.isArray(attributeNames) ||
          !("reference" in attributeNames)
        ) throw new Error("Не получена проекция имён")
        return parseXmlDocumentWithSaxes(
          `<Transport owner="${String(inputs.ownerType)}" reference="${String(attributeNames.reference)}"/>`,
        ).roots
      },
    }
    const runtime = anomalyRuntime(registration)

    expect(runtime.generateCompactRaw({
      rule: itemRule,
      propertyKey: "transport",
      yaml: {},
    })?.[0]?.attributes.map(({ value }) => value)).toEqual([
      "SyntheticOwner",
      "Ссылка",
    ])
  })

  it("строит compact raw из standard index с объявленными key-input dependencies", () => {
    const registration = propertyTypeRegistration(
      standardIndexInputs,
      (inputs) => parseXmlDocumentWithSaxes(
        `<Transport reference="${String(inputs.indexValue)}"/>`,
      ).roots,
    )
    const runtime = anomalyRuntime(registration, {
      resolveStandardIndexInput: ({ index, keyInputs }) =>
        index === "standardAttributes"
          ? `${String(keyInputs.ownerType)}.Ссылка`
          : undefined,
    })

    expect(runtime.generateCompactRaw({
      rule: itemRule,
      propertyKey: "transport",
      yaml: {},
    })?.[0]?.attributes[0]?.value).toBe("SyntheticOwner.Ссылка")
  })

  it("не передаёт standard index resolver необъявленные key inputs", () => {
    let resolverCalls = 0
    const registration = propertyTypeRegistration(standardIndexInputs, () => [])
    const runtime = anomalyRuntime(registration, {
      resolveStandardIndexInput: ({ keyInputs }) => {
        resolverCalls += 1
        return keyInputs.hidden
      },
    })
    const params = transportParams()

    expect(() => runtime.generateCompactRaw(params)).toThrow(/необъявлен.*hidden/i)
    expect(() => runtime.generateCompactRaw(params)).toThrow(/заблокирован/i)
    expect(resolverCalls).toBe(1)
  })

  it("блокирует регистрацию после любой ошибки standard index resolver", () => {
    let resolverCalls = 0
    const registration = propertyTypeRegistration(standardIndexInputs, () => [])
    const runtime = anomalyRuntime(registration, {
      resolveStandardIndexInput: () => {
        resolverCalls += 1
        throw new Error("index unavailable")
      },
    })
    const params = transportParams()

    expect(() => runtime.generateCompactRaw(params)).toThrow(/index unavailable/i)
    expect(() => runtime.generateCompactRaw(params)).toThrow(/заблокирован/i)
    expect(resolverCalls).toBe(1)
  })

  it("отклоняет неплоскую PropertyRule projection до генератора", () => {
    let calls = 0
    const registration = propertyTypeRegistration([{
      name: "unsafe",
      source: { kind: "propertyRule", fieldPath: ["unsafe"] },
    }], () => {
      calls += 1
      return []
    })
    const runtime = anomalyRuntime(registration)
    const rule: MetadataItemRule = {
      itemType: "SyntheticOwner",
      properties: {
        transport: {
          type: "SyntheticTransport",
          yaml: "Транспорт",
          unsafe: () => "value",
        },
      },
    }

    expect(() => runtime.generateCompactRaw({
      rule,
      propertyKey: "transport",
      yaml: {},
    })).toThrow(/plain-data/i)
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
