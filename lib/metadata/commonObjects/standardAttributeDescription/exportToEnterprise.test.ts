import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
import {
  exportStandardAttributeDescriptionToEnterprise,
  exportStandardAttributeDescriptionsToEnterprise,
} from "./exportToEnterprise"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionEnterprise,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
} from "./types"

describe("exportStandardAttributeDescriptionToEnterprise", () => {
  it("should export standard attribute description to enterprise", () => {
    const data: StandardAttributeDescription = {
      name: "PredefinedDataName",
      fillChecking: "ShowError",
      synonym: { items: { ru: "Какой-то синоним" } },
    }

    const expectedResult: StandardAttributeDescriptionEnterprise = {
      Синоним: "Какой-то синоним",
      ПроверкаЗаполнения: "ВыдаватьОшибку",
    }

    const result = exportStandardAttributeDescriptionToEnterprise(mockConfigurationSettings, data)

    expect(result).toEqual(expectedResult)
  })

  it("should export standard attributes with name", () => {
    const data: StandardAttributeDescriptions = [
      {
        name: "PredefinedDataName",
        fillChecking: "ShowError",
        synonym: { items: { ru: "Какой-то синоним" } },
      },
    ]

    const expectedResult: StandardAttributeDescriptionsEnterprise = {
      ИмяПредопределенныхДанных: {
        Синоним: "Какой-то синоним",
        ПроверкаЗаполнения: "ВыдаватьОшибку",
      },
    }

    const result = exportStandardAttributeDescriptionsToEnterprise(mockConfigurationSettings, data)

    expect(result).toEqual(expectedResult)
  })
})
