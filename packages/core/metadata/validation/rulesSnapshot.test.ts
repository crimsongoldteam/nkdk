import { describe, expect, it } from "vitest"
import { mockContext } from "../../tests/mockContext"
import { createValidationRulesSnapshot, findValidationRulesSpec } from "./rulesSnapshot"

describe("ValidationRulesSnapshot", () => {
  it("is JSON-compatible", () => {
    const snapshot = createValidationRulesSnapshot(mockContext)

    expect(structuredClone(snapshot)).toEqual(snapshot)
    expect(JSON.parse(JSON.stringify(snapshot))).toEqual(snapshot)
  })

  it("includes catalog properties descriptor", () => {
    const snapshot = createValidationRulesSnapshot(mockContext)
    const catalog = findValidationRulesSpec(snapshot, "Справочник")

    expect(catalog).toMatchObject({
      dir: "Справочник",
      itemType: "MetadataCatalog",
      root: "Catalog",
      properties: expect.arrayContaining([
        expect.objectContaining({
          modelKey: "attributes",
          yamlPath: ["Реквизиты"],
        }),
      ]),
    })
  })

  it("includes metadata target descriptors", () => {
    const snapshot = createValidationRulesSnapshot(mockContext)
    const catalog = findValidationRulesSpec(snapshot, "Справочник")

    expect(catalog?.properties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          modelKey: "defaultObjectForm",
          yamlPath: ["ОсновнаяФормаОбъекта"],
          metadataTarget: expect.objectContaining({ kind: "member" }),
        }),
      ])
    )
  })
})
