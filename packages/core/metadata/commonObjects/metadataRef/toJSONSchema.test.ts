import { describe, expect, it } from "vitest"
import { getTypeRule } from "~/metadata/orchestration"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataItemLinkToJSONSchema } from "./toJSONSchema"

describe("exportMetadataItemLinkToJSONSchema", () => {
  it("should export metadata item link JSON schema", () => {
    const result = exportMetadataItemLinkToJSONSchema({ context: mockContext, rule: mockRule, value: undefined })

    expect(result).toMatchObject({
      type: "string",
      pattern: expect.stringContaining("Справочник"),
    })
  })

  it("should register metadata item link JSON schema exporter", () => {
    const exportToJSONSchema = getTypeRule("MetadataItemLink", "exportToJSONSchema")

    const result = exportToJSONSchema?.({ context: mockContext, rule: mockRule, value: undefined })

    expect(result).toMatchObject({ type: "string" })
  })

  it("uses metadataTarget roots for metadata item links", () => {
    const result = exportMetadataItemLinkToJSONSchema({
      context: mockContext,
      rule: {
        ...mockRule,
        type: "MetadataItemLink",
        metadataTarget: { kind: "object", roots: ["Catalog"] },
      },
      value: undefined,
    })

    expect(result).toMatchObject({
      type: "string",
      examples: ["Справочник.ИмяСправочника"],
    })
    expect(new RegExp(String(result?.pattern)).test("Справочник.ИмяСправочника")).toBe(true)
    expect(new RegExp(String(result?.pattern)).test("Документ.ИмяДокумента")).toBe(false)
  })

  it("wraps metadata item link schemas into array items", () => {
    const exportToJSONSchema = getTypeRule("MetadataItemLinks", "exportToJSONSchema")

    const result = exportToJSONSchema?.({
      context: mockContext,
      rule: {
        ...mockRule,
        type: "MetadataItemLinks",
        metadataTarget: { kind: "object", roots: ["Document"] },
      },
      value: undefined,
    })

    expect(result).toMatchObject({
      type: "array",
      items: {
        type: "string",
        examples: ["Документ.ИмяДокумента"],
      },
    })
    const itemPattern = String((result as { items?: { pattern?: string } })?.items?.pattern)

    expect(new RegExp(itemPattern).test("Документ.ИмяДокумента")).toBe(true)
    expect(new RegExp(itemPattern).test("Справочник.ИмяСправочника")).toBe(false)
  })
})
