import { expect, it, describe } from "vitest"
import { TCommand } from "./types"
import { formatCommands } from "./format"

describe("formatCommands", () => {
  it("should format command", () => {
    const data: TCommand = {
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

    const result = formatCommands([data])

    expect(result).toEqual([expectedResult])
  })
})
