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
        { name: "mode", propertyPath: ["settings", "mode"] },
        { name: "mode", propertyPath: ["otherMode"] },
      ],
      generate: () => [],
    }

    expect(() => createXmlAnomalyRegistry([registration])).toThrow(
      /вход compact raw.*mode.*повтор/i,
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
