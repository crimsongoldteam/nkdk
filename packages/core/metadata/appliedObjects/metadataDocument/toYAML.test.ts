import { describe, expect, it } from "vitest"
import { exportMetadataItemToYAML } from "~/metadata/orchestration"
import { mockContextToYAML } from "~/tests/mockContext"
import { MetadataDocumentRules } from "./rules"

describe("MetadataDocument toYAML", () => {
  it("сериализует numberType", () => {
    const yaml = exportMetadataItemToYAML({
      context: mockContextToYAML,
      data: { itemType: "MetadataDocument", name: "ТестДокумент", numberType: "String" } as any,
      rule: MetadataDocumentRules,
    })
    expect(yaml).toMatchObject({
      ТипНомера: "Строка",
    })
  })

  it("возвращает undefined при отсутствии данных", () => {
    const yaml = exportMetadataItemToYAML({
      context: mockContextToYAML,
      data: undefined,
      rule: MetadataDocumentRules,
    })
    expect(yaml).toBeUndefined()
  })
})
