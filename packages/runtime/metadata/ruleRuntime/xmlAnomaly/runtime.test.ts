import { describe, expect, it } from "vitest"

import { createXmlAnomalyRegistry } from "./registry"
import { createXmlAnomalyRuntime } from "./runtime"

describe("runtime XML-аномалий", () => {
  it("различает обязательный important и обычное свойство", () => {
    const runtime = createXmlAnomalyRuntime(createXmlAnomalyRegistry([{
      kind: "important",
      boundary: { propertyType: "SyntheticTransport" },
    }]))

    expect(runtime.requiresImportant({
      itemType: "SyntheticOwner",
      propertyKey: "transport",
      propertyType: "SyntheticTransport",
    })).toBe(true)
    expect(runtime.requiresImportant({
      itemType: "SyntheticOwner",
      propertyKey: "settings",
      propertyType: "SyntheticSettings",
    })).toBe(false)
  })
})
