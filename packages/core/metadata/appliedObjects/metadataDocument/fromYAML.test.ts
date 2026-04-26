import { describe, expect, it } from "vitest"
import { importMetadataItemFromYAML } from "~/metadata/orchestration"
import { mockContext } from "~/tests/mockContext"
import { MetadataDocumentRules } from "./rules"

describe("MetadataDocument fromYAML", () => {
  it("парсит минимальный YAML — numberType", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      yaml: { ТипНомера: "Строка" },
      rule: MetadataDocumentRules,
      name: "ТестДокумент",
    })
    expect(result).toBeDefined()
    expect(result?.numberType).toBe("String")
  })

  it("парсит YAML — поле numberPeriodicity", () => {
    const result = importMetadataItemFromYAML({
      context: mockContext,
      yaml: { ПериодичностьНомера: "День" },
      rule: MetadataDocumentRules,
      name: "ТестДокумент",
    })
    expect(result).toBeDefined()
    expect(result?.numberPeriodicity).toBe("Day")
  })
})
