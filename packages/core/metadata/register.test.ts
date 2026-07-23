import { describe, expect, it } from "vitest"
import { registerCoreMetadata } from "./register"
import { getTypeRule } from "./orchestration"

describe("registerCoreMetadata", () => {
  it("can be called more than once and keeps registered metadata behavior available", () => {
    registerCoreMetadata()
    registerCoreMetadata()

    expect(getTypeRule("I8nText", "exportToXML")).toBeDefined()
    expect(getTypeRule("ClientApplicationForm", "yamlToXMLNestedRule")).toBeDefined()
  })
})
