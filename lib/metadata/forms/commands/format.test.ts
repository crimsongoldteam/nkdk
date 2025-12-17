import { describe, expect, it } from "vitest"
import { mockConfigurationSettings } from "../../../tests/mockConfigurationSettings"
import { formatCommands } from "./format"
import { Command } from "./types"

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

    const expectedResult = `Заголовок: Файлы
Подсказка: Состав комплекта подобрать файлы
Действие: СоставКомплектаПодобратьФайлы
ИспользованиеТекущейСтроки: НеИспользует`

    const result = formatCommands([data], mockConfigurationSettings)

    expect(result).toEqual([expectedResult])
  })
})
