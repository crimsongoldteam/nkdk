import { describe, expect, it } from "vitest"

import type {
  XmlAnomalyRegistration,
  XmlCompactRawRegistration,
} from "./contracts"
import { createXmlAnomalyRegistry } from "./registry"

describe("реестр XML-аномалий", () => {
  it("разрешает регистрации по типу свойства и по itemType/propertyKey", () => {
    const byType: XmlAnomalyRegistration = {
      kind: "important",
      boundary: { propertyType: "SyntheticValue" },
    }
    const byProperty: XmlAnomalyRegistration = {
      kind: "hiddenSingletonName",
      boundary: { itemType: "SyntheticOwner", propertyKey: "value" },
    }
    const registry = createXmlAnomalyRegistry([byType, byProperty])

    expect(registry.resolve({
      itemType: "SyntheticOwner",
      propertyKey: "other",
      propertyType: "SyntheticValue",
    })).toBe(byType)
    expect(registry.resolve({
      itemType: "SyntheticOwner",
      propertyKey: "value",
      propertyType: "OtherValue",
    })).toBe(byProperty)
  })

  it("отклоняет две регистрации одной границы", () => {
    expect(() => createXmlAnomalyRegistry([
      {
        kind: "important",
        boundary: { itemType: "SyntheticOwner", propertyKey: "value" },
      },
      {
        kind: "hiddenSingletonName",
        boundary: { itemType: "SyntheticOwner", propertyKey: "value" },
      },
    ])).toThrow(/конфликт.*SyntheticOwner\.value/i)
  })

  it("отклоняет неоднозначную декларацию входов compact raw", () => {
    const registration: XmlCompactRawRegistration = {
      kind: "compactRaw",
      boundary: { propertyType: "SyntheticValue" },
      inputs: [
        {
          name: "mode",
          source: { kind: "yamlProperty", propertyPath: ["settings", "mode"] },
        },
        {
          name: "mode",
          source: { kind: "yamlProperty", propertyPath: ["otherMode"] },
        },
      ],
      generate: () => [],
    }

    expect(() => createXmlAnomalyRegistry([registration])).toThrow(
      /вход compact raw.*mode.*повтор/i,
    )
  })

  it.each([
    [
      "YAML property path",
      [{ name: "value", source: { kind: "yamlProperty", propertyPath: [] } }],
      /YAML.*path/i,
    ],
    [
      "owner projection",
      [{ name: "value", source: { kind: "owner", projection: "unknown" } }],
      /owner.*projection/i,
    ],
    [
      "PropertyRule field path",
      [{ name: "value", source: { kind: "propertyRule", fieldPath: [] } }],
      /PropertyRule.*path/i,
    ],
    [
      "standard index name",
      [{ name: "value", source: { kind: "standardIndex", index: "", keyInputs: [] } }],
      /index.*name/i,
    ],
    [
      "standard index dependency",
      [{
        name: "value",
        source: { kind: "standardIndex", index: "sample", keyInputs: ["missing"] },
      }],
      /index.*dependency.*missing/i,
    ],
    [
      "unique standard index dependencies",
      [
        { name: "owner", source: { kind: "owner", projection: "itemType" } },
        {
          name: "value",
          source: {
            kind: "standardIndex",
            index: "sample",
            keyInputs: ["owner", "owner"],
          },
        },
      ],
      /index.*dependency.*owner.*повтор/i,
    ],
  ])("отклоняет неверную декларацию source: %s", (_name, inputs, message) => {
    expect(() => createXmlAnomalyRegistry([{
      kind: "compactRaw",
      boundary: { propertyType: "SyntheticValue" },
      inputs,
      generate: () => [],
    } as XmlCompactRawRegistration])).toThrow(message)
  })

  it("отклоняет цикл key-input dependencies standard index", () => {
    const registration: XmlCompactRawRegistration = {
      kind: "compactRaw",
      boundary: { propertyType: "SyntheticValue" },
      inputs: [
        {
          name: "first",
          source: {
            kind: "standardIndex",
            index: "sample",
            keyInputs: ["second"],
          },
        },
        {
          name: "second",
          source: {
            kind: "standardIndex",
            index: "sample",
            keyInputs: ["first"],
          },
        },
      ],
      generate: () => [],
    }

    expect(() => createXmlAnomalyRegistry([registration])).toThrow(
      /цикл.*index dependencies/i,
    )
  })

  it("работает с произвольными нейтральными именами границ", () => {
    const registration: XmlAnomalyRegistration = {
      kind: "important",
      boundary: {
        itemType: "NeverSeenBefore",
        propertyKey: "futureProperty",
      },
    }
    const registry = createXmlAnomalyRegistry([registration])

    expect(registry.resolve({
      itemType: "NeverSeenBefore",
      propertyKey: "futureProperty",
      propertyType: "FutureType",
    })).toBe(registration)
  })
})
