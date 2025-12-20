import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "~/lib/tests/mockConfigurationSettings"
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

    const result = exportMetadataCommandToEnterprise(metadataCommand, mockConfigurationSettings)

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

    const result = exportMetadataCommandToEnterprise(metadataCommand, mockConfigurationSettings)

    expect(result).toEqual(expectedResult)
  })
})
