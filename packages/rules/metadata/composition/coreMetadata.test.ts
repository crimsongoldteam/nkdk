import { describe, expect, it } from "vitest"
import { registerCoreMetadata, registerMetadataLayers } from "./coreMetadata"
import { getTypeRule } from "../ruleRuntime"
import { explicitXMLPropertyValidationMode } from "../ruleRuntime/property/explicitXMLPropertyRegistry"

describe("registerCoreMetadata", () => {
  it("registers validation adapters after concrete metadata", () => {
    const trace: string[] = []
    registerMetadataLayers({
      commonObjects: () => trace.push("commonObjects"),
      forms: () => trace.push("forms"),
      appliedObjects: () => trace.push("appliedObjects"),
      validationAdapters: () => trace.push("validationAdapters"),
    })

    expect(trace).toEqual(["commonObjects", "forms", "appliedObjects", "validationAdapters"])
  })

  it("can be called more than once and keeps registered metadata behavior available", () => {
    registerCoreMetadata()
    registerCoreMetadata()

    expect(getTypeRule("I8nText", "exportToXML")).toBeDefined()
    expect(getTypeRule("ClientApplicationForm", "yamlToXMLNestedRule")).toBeDefined()
    expect(explicitXMLPropertyValidationMode(
      "Owner",
      "standardAttributes",
      "StandardAttributeDescriptions",
    )).toBe("empty")
  })
})
