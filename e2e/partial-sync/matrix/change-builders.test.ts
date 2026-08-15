import { describe, expect, it } from "vitest"
import {
  appendYamlSection,
  chainChanges,
  replaceBinary,
  replaceText,
  replaceYamlLine,
} from "./change-builders"

describe("partial sync change builders", () => {
  it("replaces exactly one root YAML line", () => {
    expect(replaceYamlLine({
      path: "Справочник/Тест/Свойства.yaml",
      contents: "Имя: Тест\nКомментарий: Старый\n",
      key: "Комментарий",
      value: "Новый",
    })).toEqual({
      path: "Справочник/Тест/Свойства.yaml",
      before: "Имя: Тест\nКомментарий: Старый\n",
      after: "Имя: Тест\nКомментарий: Новый\n",
    })
  })

  it.each([
    ["missing", "Имя: Тест\n"],
    ["duplicated", "Комментарий: Первый\nКомментарий: Второй\n"],
    ["nested", "Комментарий: Корневой\n  Комментарий: Вложенный\n"],
  ])("rejects a %s unique YAML line", (_case, contents) => {
    expect(() => replaceYamlLine({
      path: "Свойства.yaml",
      contents,
      key: "Комментарий",
      value: "Новый",
    })).toThrow("Не найдена единственная YAML-строка")
  })

  it("appends a complete YAML section without changing the source", () => {
    expect(appendYamlSection({
      path: "Свойства.yaml",
      contents: "Имя: Тест\n",
      section: "Реквизиты:\n  - Имя: Код\n",
    })).toEqual({
      path: "Свойства.yaml",
      before: "Имя: Тест\n",
      after: "Имя: Тест\nРеквизиты:\n  - Имя: Код\n",
    })
  })

  it("replaces exactly one text fragment", () => {
    expect(replaceText({
      path: "Модуль.bsl",
      contents: "Процедура До()\nКонецПроцедуры\n",
      before: "До",
      after: "После",
    })).toEqual({
      path: "Модуль.bsl",
      before: "Процедура До()\nКонецПроцедуры\n",
      after: "Процедура После()\nКонецПроцедуры\n",
    })
  })

  it("rejects an ambiguous text replacement", () => {
    expect(() => replaceText({
      path: "Модуль.bsl",
      contents: "До До",
      before: "До",
      after: "После",
    })).toThrow("Не найден единственный текстовый фрагмент")
  })

  it("copies binary states", () => {
    const before = new Uint8Array([1, 2])
    const after = new Uint8Array([3, 4])
    const change = replaceBinary({ path: "Картинка.bin", before, after })

    before[0] = 9
    after[0] = 8

    expect(change).toEqual({
      path: "Картинка.bin",
      before: new Uint8Array([1, 2]),
      after: new Uint8Array([3, 4]),
    })
  })

  it("returns a continuous chain", () => {
    const first = { path: "Свойства.yaml", before: "до", after: "между" } as const
    const second = { path: "Свойства.yaml", before: "между", after: "после" } as const

    expect(chainChanges(first, second)).toEqual([first, second])
  })

  it("rejects a discontinuous chain for the same path", () => {
    expect(() => chainChanges(
      { path: "Свойства.yaml", before: "до", after: "между" },
      { path: "Свойства.yaml", before: "другое", after: "после" },
    )).toThrow("Разрыв цепочки изменений")
  })
})
