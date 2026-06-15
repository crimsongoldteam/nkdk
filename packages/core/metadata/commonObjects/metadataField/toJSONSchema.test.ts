import { describe, expect, it } from "vitest"
import { getTypeRule } from "~/metadata/orchestration"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataFieldToJSONSchema } from "./toJSONSchema"

describe("exportMetadataFieldToJSONSchema", () => {
  it("uses metadataTarget roots for metadata fields", () => {
    const result = exportMetadataFieldToJSONSchema({
      context: mockContext,
      rule: {
        ...mockRule,
        type: "MetadataField",
        metadataTarget: { kind: "member", owner: "explicit", roots: ["Catalog"], memberKinds: ["Attribute", "StandardAttribute"] },
      },
      value: undefined,
    })

    expect(result).toMatchObject({
      type: "string",
      examples: ["Справочник.ИмяСправочника.Реквизит.ИмяРеквизита"],
    })
    const pattern = new RegExp(String(result?.pattern))
    const examples = Array.isArray(result?.examples) ? result.examples : []

    expect(pattern.test("Справочник.ИмяСправочника.Реквизит.ИмяРеквизита")).toBe(true)
    for (const example of examples) expect(pattern.test(String(example))).toBe(true)
    expect(
      pattern.test(
        "Справочник.ИмяСправочника.ТабличнаяЧасть.ИмяТабличнойЧасти.Реквизит.ИмяРеквизита"
      )
    ).toBe(true)
    expect(pattern.test("Документ.ИмяДокумента.Реквизит.ИмяРеквизита")).toBe(false)
  })

  it("wraps metadata field schemas into array items", () => {
    const exportToJSONSchema = getTypeRule("MetadataFields", "exportToJSONSchema")

    const result = exportToJSONSchema?.({
      context: mockContext,
      rule: {
        ...mockRule,
        type: "MetadataFields",
        metadataTarget: { kind: "member", owner: "explicit", roots: ["Document"], memberKinds: ["Attribute", "StandardAttribute"] },
      },
      value: undefined,
    })

    expect(result).toMatchObject({
      type: "array",
      items: {
        type: "string",
        examples: ["Документ.ИмяДокумента.Реквизит.ИмяРеквизита"],
      },
    })
    const itemPattern = String((result as { items?: { pattern?: string } })?.items?.pattern)

    expect(new RegExp(itemPattern).test("Документ.ИмяДокумента.Реквизит.ИмяРеквизита")).toBe(true)
    expect(new RegExp(itemPattern).test("Справочник.ИмяСправочника.Реквизит.ИмяРеквизита")).toBe(false)
  })

  it("uses member fallback for registered metadata field schemas", () => {
    const exportToJSONSchema = getTypeRule("MetadataField", "exportToJSONSchema")

    const result = exportToJSONSchema?.({
      context: mockContext,
      rule: { ...mockRule, type: "MetadataField" },
      value: undefined,
    })

    expect(result).toMatchObject({
      type: "string",
      examples: ["Справочник.ИмяСправочника.Реквизит.ИмяРеквизита"],
    })
    expect(new RegExp(String(result?.pattern)).test("Справочник.ИмяСправочника.Реквизит.ИмяРеквизита")).toBe(true)
    expect(new RegExp(String(result?.pattern)).test("Справочник.ИмяСправочника")).toBe(false)
  })

  it("uses member fallback for registered metadata fields array schemas", () => {
    const exportToJSONSchema = getTypeRule("MetadataFields", "exportToJSONSchema")

    const result = exportToJSONSchema?.({
      context: mockContext,
      rule: { ...mockRule, type: "MetadataFields" },
      value: undefined,
    })
    const itemPattern = String((result as { items?: { pattern?: string } })?.items?.pattern)

    expect(result).toMatchObject({
      type: "array",
      items: {
        type: "string",
        examples: ["Справочник.ИмяСправочника.Реквизит.ИмяРеквизита"],
      },
    })
    expect(new RegExp(itemPattern).test("Справочник.ИмяСправочника.Реквизит.ИмяРеквизита")).toBe(true)
    expect(new RegExp(itemPattern).test("Справочник.ИмяСправочника")).toBe(false)
  })
})
