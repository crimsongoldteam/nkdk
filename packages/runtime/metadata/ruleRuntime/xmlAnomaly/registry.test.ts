import { describe, expect, it } from "vitest"

import type { XmlAnomalyRegistration } from "./contracts"
import { createXmlAnomalyRegistry } from "./registry"

describe("реестр XML-аномалий", () => {
  it("разрешает important по типу свойства и по itemType/propertyKey", () => {
    const byType: XmlAnomalyRegistration = {
      kind: "important",
      boundary: { propertyType: "SyntheticValue" },
    }
    const byProperty: XmlAnomalyRegistration = {
      kind: "important",
      boundary: { itemType: "SyntheticOwner", propertyKey: "value" },
    }
    const registry = createXmlAnomalyRegistry([byType, byProperty])

    expect(registry.resolve({
      itemType: "OtherOwner",
      propertyKey: "other",
      propertyType: "SyntheticValue",
    })).toBe(byType)
    expect(registry.resolve({
      itemType: "SyntheticOwner",
      propertyKey: "value",
      propertyType: "OtherValue",
    })).toBe(byProperty)
  })

  it("отклоняет повторную регистрацию одной границы", () => {
    expect(() => createXmlAnomalyRegistry([
      { kind: "important", boundary: { propertyType: "SyntheticValue" } },
      { kind: "important", boundary: { propertyType: "SyntheticValue" } },
    ])).toThrow(/конфликт.*SyntheticValue/i)
  })

  it("отклоняет пустую границу", () => {
    expect(() => createXmlAnomalyRegistry([{
      kind: "important",
      boundary: { propertyType: "" },
    }])).toThrow(/тип свойства/i)
  })
})
