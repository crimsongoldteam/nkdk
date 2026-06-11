import { describe, expect, it } from "vitest"
import { registerCoreMetadata } from "~/metadata/register"
import { getTypeRule } from "~/metadata/orchestration"

describe("registerCoreMetadata", () => {
  it("can be called more than once and keeps registered metadata behavior available", () => {
    registerCoreMetadata()
    registerCoreMetadata()

    expect(getTypeRule("I8nText", "exportToXML")).toBeDefined()
    expect(getTypeRule("ClientApplicationForm", "exportToXML")).toBeDefined()
  })
})
