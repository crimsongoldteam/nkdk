import { expect, it } from "vitest"
import { TCommand } from "./types"
import { formatCommands } from "./format"

it("should format command", () => {
  const data: TCommand = {
    name: "СоставКомплектаПодобратьФайлы",
    id: "60",
    title: { ru: "Файлы" },
    toolTip: { ru: "Состав комплекта подобрать файлы" },
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
