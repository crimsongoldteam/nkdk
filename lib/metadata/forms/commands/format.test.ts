import { expect, it, describe } from "vitest"
import { Command } from "./types"
import { formatCommands } from "./format"
import { TConfigurationSettings } from "../../configurationSettings/types"

const configurationSettings: TConfigurationSettings = {
  defaultLanguage: "ru",
}

describe("formatCommands", () => {
  it("should format command", () => {
    const data: Command = {
      name: "СоставКомплектаПодобратьФайлы",
      id: "60",
      title: { items: { ru: "Файлы" } },
      toolTip: { items: { ru: "Состав комплекта подобрать файлы" } },
      action: "СоставКомплектаПодобратьФайлы",
      currentRowUse: "DontUse",
    }

    const expectedResult = `СоставКомплектаПодобратьФайлы:
  Заголовок: Файлы
  Подсказка: Состав комплекта подобрать файлы
  Действие: СоставКомплектаПодобратьФайлы
  ИспользованиеТекущейСтроки: НеИспользует`

    const result = formatCommands([data], configurationSettings)

    expect(result).toEqual([expectedResult])
  })
})
