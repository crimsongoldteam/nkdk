import { describe, expect, it } from "vitest"
import { mockСontext } from "~/packages/core/tests/mockContext"
import { exportMetadataTabularSectionToEnterprise } from "./exportToEnterprise"
import { MetadataTabularSection, MetadataTabularSectionEnterprise } from "./types"

describe("exportMetadataTabularSectionToEnterprise", () => {
  it("should export metadata tabular section to enterprise", () => {
    const metadataTabularSection: MetadataTabularSection = {
      name: "Контакты",
      fillChecking: "DontCheck",
      synonym: { items: { ru: "Какие-то контакты" } },
    }

    const expectedResult: MetadataTabularSectionEnterprise = {
      Синоним: "Какие-то контакты",
      ПроверкаЗаполнения: "НеПроверять",
    }

    const result = exportMetadataTabularSectionToEnterprise(mockСontext, metadataTabularSection)
    expect(result).toEqual(expectedResult)
  })

  it("should export with synonym is same as name", () => {
    const metadataTabularSection: MetadataTabularSection = {
      name: "ИсторияКПП",
      fillChecking: "DontCheck",
      synonym: { items: { ru: "История КПП" } },
    }

    const expectedResult: MetadataTabularSectionEnterprise = {
      ПроверкаЗаполнения: "НеПроверять",
    }

    const result = exportMetadataTabularSectionToEnterprise(mockСontext, metadataTabularSection)
    expect(result).toEqual(expectedResult)
  })
})
