import { describe, expect, it } from "vitest"
import { mockcontext } from "~/lib/tests/mockContext"
import { exportMetadataCommandToEnterprise } from "./exportToEnterprise"
import { MetadataCommand, MetadataCommandEnterprise } from "./types"

describe("exportMetadataCommandToEnterprise", () => {
  it("should export metadata command to enterprise", () => {
    const metadataCommand: MetadataCommand = {
      name: "ТестоваяКоманда",
      synonym: { items: { ru: "Какая-то команда" } },
      group: "NavigationPanelImportant",
      parameterUseMode: "Single",
    }

    const expectedResult: MetadataCommandEnterprise = {
      Синоним: "Какая-то команда",
      Группа: "ПанельНавигацииВажное",
      РежимИспользованияПараметра: "Одиночный",
    }

    const result = exportMetadataCommandToEnterprise(mockcontext, metadataCommand)

    expect(result).toEqual(expectedResult)
  })

  it("should export with user group", () => {
    const metadataCommand: MetadataCommand = {
      name: "ТестоваяКоманда",
      synonym: { items: { ru: "Какая-то команда" } },
      group: "CommandGroup.Печать",
    }

    const expectedResult: MetadataCommandEnterprise = {
      Синоним: "Какая-то команда",
      Группа: "ГруппаКоманд.Печать",
    }

    const result = exportMetadataCommandToEnterprise(mockcontext, metadataCommand)

    expect(result).toEqual(expectedResult)
  })

  it("should omit synonym if it is same as name", () => {
    const metadataCommand: MetadataCommand = {
      name: "ТестоваяКоманда",
      synonym: { items: { ru: "Тестовая команда" } },
      parameterUseMode: "Multiple",
      group: "NavigationPanelImportant",
    }

    const expectedResult: MetadataCommandEnterprise = {
      РежимИспользованияПараметра: "Множественный",
      Группа: "ПанельНавигацииВажное",
    }

    const result = exportMetadataCommandToEnterprise(mockcontext, metadataCommand)

    expect(result).toEqual(expectedResult)
  })
})
