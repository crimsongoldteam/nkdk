import { describe, expect, it } from "vitest"
import { isMetadataOperationTarget, metadataOperationTargetJSONSchema } from "./targetSchema"

describe("metadata operation target schema", () => {
  it("accepts object, nested collection and file item targets", () => {
    expect(isMetadataOperationTarget({ kind: "object", itemTypePrefix: "Справочник", name: "Товары" })).toBe(true)
    expect(
      isMetadataOperationTarget({
        kind: "attribute",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        name: "Артикул",
      }),
    ).toBe(true)
    expect(
      isMetadataOperationTarget({
        kind: "attribute",
        owner: { itemTypePrefix: "Документ", name: "Заказ" },
        parent: { kind: "tabularSection", name: "Товары" },
        name: "Количество",
      }),
    ).toBe(true)
    expect(
      isMetadataOperationTarget({
        kind: "fileItem",
        owner: { itemTypePrefix: "Справочник", name: "Товары" },
        role: "form",
        name: "ФормаЭлемента",
      }),
    ).toBe(true)
  })

  it("rejects ambiguous or path-like targets", () => {
    expect(isMetadataOperationTarget("Справочник.Товары")).toBe(false)
    expect(isMetadataOperationTarget({ kind: "attribute", name: "Артикул" })).toBe(false)
    expect(isMetadataOperationTarget({ kind: "object", itemTypePrefix: "Справочник", name: "Товары.Артикул" })).toBe(
      false,
    )
  })

  it("exports JSON Schema with kind discriminator", () => {
    expect(metadataOperationTargetJSONSchema).toMatchObject({
      anyOf: expect.any(Array),
    })
    expect(JSON.stringify(metadataOperationTargetJSONSchema)).toContain('"kind"')
    expect(JSON.stringify(metadataOperationTargetJSONSchema)).toContain('"fileItem"')
  })
})
