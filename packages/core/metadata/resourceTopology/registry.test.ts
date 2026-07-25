import { describe, expect, it, vi } from "vitest"
import type { MetadataItemRule, PropertyRule } from "../orchestration/property/types"

const itemRule = { itemType: "TestForm", properties: {} } as MetadataItemRule
const propertyRule = { type: "ChildFormNames" } as PropertyRule

describe("property resource topology registry", () => {
  it("returns all resource kinds from one property-type contribution", async () => {
    await withFreshRegistry(async () => {
      const { registerTypeRule } = await import("../orchestration/property/typeRuleRegistry")
      const { describePropertyResourceTopology } = await import("./registry")
      registerTypeRule("ChildFormNames", "resourceTopology", () => [
        {
          kind: "content",
          projectPattern: "Формы/{itemName}/Форма.yaml",
          role: "fileItem",
          required: true,
          repeatable: true,
          compositionImpact: "none",
          itemRule,
          source: { kind: "itemRule", description: "form content" },
        },
        {
          kind: "xmlDocument",
          assignmentProjectPattern: "",
          xmlPattern: "Forms/{itemName}.xml",
          role: "metadata",
          required: true,
          read: { inputRole: "metadata" },
          prepareCapabilityId: "form",
          source: { kind: "itemRule", description: "form metadata" },
        },
        {
          kind: "xmlDocument",
          assignmentProjectPattern: "",
          xmlPattern: "Forms/{itemName}/Ext/Form.xml",
          role: "body",
          required: true,
          read: { inputRole: "body" },
          prepareCapabilityId: "form",
          source: { kind: "itemRule", description: "form body" },
        },
        {
          kind: "externalFile",
          assignmentProjectPattern: "",
          projectPattern: "Формы/{itemName}/Модуль.bsl",
          xmlPattern: "Forms/{itemName}/Ext/Form/Module.bsl",
          direction: "both",
          transferCapabilityId: "copy",
          compositionImpact: "none",
          source: { kind: "itemRule", description: "form module" },
        },
      ])

      expect(describePropertyResourceTopology("forms", propertyRule)).toEqual([
        expect.objectContaining({
          kind: "content",
          source: { kind: "property", description: "forms:ChildFormNames" },
        }),
        expect.objectContaining({ kind: "xmlDocument", role: "metadata" }),
        expect.objectContaining({ kind: "xmlDocument", role: "body" }),
        expect.objectContaining({ kind: "externalFile" }),
      ])
    })
  })

  it("returns an empty list when the property type has no contribution", async () => {
    await withFreshRegistry(async () => {
      const { describePropertyResourceTopology } = await import("./registry")
      expect(describePropertyResourceTopology("forms", propertyRule)).toEqual([])
    })
  })
})

async function withFreshRegistry(assertions: () => Promise<void>): Promise<void> {
  vi.resetModules()
  try {
    await assertions()
  } finally {
    vi.resetModules()
    const { registerCoreMetadata } = await import("../register")
    registerCoreMetadata()
  }
}
