import { describe, expect, it } from "vitest"
import { mockСontext } from "~/tests/mockContext"
import {
  importStandardAttributeDescriptionFromEnterprise,
  importStandardAttributeDescriptionsFromEnterprise,
} from "./importFromEnterprise"
import {
  StandardAttributeDescription,
  StandardAttributeDescriptionEnterprise,
  StandardAttributeDescriptions,
  StandardAttributeDescriptionsEnterprise,
} from "./types"

describe("importStandardAttributeDescriptionFromEnterprise", () => {
  it("should import standard attribute description from enterprise", () => {
    const data: StandardAttributeDescriptionEnterprise = {
      Синоним: "Какой-то синоним",
      ПроверкаЗаполнения: "ВыдаватьОшибку",
    }

    const expectedResult: StandardAttributeDescription = {
      name: "PredefinedDataName",
      fillChecking: "ShowError",
      synonym: { items: { ru: "Какой-то синоним" } },
    }

    const result = importStandardAttributeDescriptionFromEnterprise(mockСontext, data, "ИмяПредопределенныхДанных")

    expect(result).toEqual(expectedResult)
  })

  it("should import standard attributes with name", () => {
    const data: StandardAttributeDescriptionsEnterprise = {
      ИмяПредопределенныхДанных: {
        Синоним: "Какой-то синоним",
        ПроверкаЗаполнения: "ВыдаватьОшибку",
      },
    }

    const expectedResult: StandardAttributeDescriptions = [
      {
        name: "PredefinedDataName",
        fillChecking: "ShowError",
        synonym: { items: { ru: "Какой-то синоним" } },
      },
    ]

    const result = importStandardAttributeDescriptionsFromEnterprise(mockСontext, data)

    expect(result).toEqual(expectedResult)
  })
})

