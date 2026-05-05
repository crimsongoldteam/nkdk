import { describe, expect, it } from "vitest"
import { mockContext, mockRule } from "~/tests/mockContext"
import { exportMetadataTabularSectionToYAML } from "./toYAML"
import { MetadataTabularSection, MetadataTabularSectionYAML } from "./types"

describe("exportMetadataTabularSectionToYAML", () => {
  it("should export metadata tabular section to enterprise", () => {
    const metadataTabularSection: MetadataTabularSection = {
      itemType: "MetadataTabularSection",
      name: "Контакты",
      fillChecking: "DontCheck",
      synonym: { items: { ru: "Какие-то контакты" } },
      attributes: [],
    }

    const expectedResult: MetadataTabularSectionYAML = {
      Синоним: "Какие-то контакты",
      ПроверкаЗаполнения: "НеПроверять",
    }

    const result = exportMetadataTabularSectionToYAML(mockContext, mockRule, metadataTabularSection)
    expect(result).toEqual(expectedResult)
  })

  it("should export with synonym is same as name", () => {
    const metadataTabularSection: MetadataTabularSection = {
      itemType: "MetadataTabularSection",
      name: "ИсторияКПП",
      fillChecking: "DontCheck",
      synonym: { items: { ru: "История КПП" } },
      attributes: [],
    }

    const expectedResult: MetadataTabularSectionYAML = {
      ПроверкаЗаполнения: "НеПроверять",
    }

    const result = exportMetadataTabularSectionToYAML(mockContext, mockRule, metadataTabularSection)
    expect(result).toEqual(expectedResult)
  })
})
