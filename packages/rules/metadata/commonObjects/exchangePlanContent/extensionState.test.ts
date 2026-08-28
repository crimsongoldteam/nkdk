import { yamlScalarTagAt } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"

import {
  joinExchangePlanExtensionContent,
  splitExchangePlanExtensionContent,
} from "./extensionState"
import { extensionContentYAML } from "./__fixtures__/extension"

describe("режимы элементов состава плана обмена", () => {
  const items = [
    { Метаданные: "Документ.ДокументВсеСвойства", Авторегистрация: "Разрешить" },
    { Метаданные: "Справочник.СправочникПолный", Авторегистрация: "Разрешить" },
    { Метаданные: "Документ.ДокументКнопкаСПараметрамиExt", Авторегистрация: "Разрешить" },
    { Метаданные: "Документ.ДокументСНумераторомExt", Авторегистрация: "Разрешить" },
  ]
  const states = [
    { metadata: "Документ.ДокументВсеСвойстваExt", state: "Modify" },
    { metadata: "Документ.ДокументВсеСвойства", state: "Check" },
    { metadata: "Справочник.СправочникВладелец", state: "Check" },
    { metadata: "Документ.ДокументСНумераторомExt", state: "Check" },
    { metadata: "Справочник.СправочникПолный", state: "Modify" },
    { metadata: "Документ.ДокументСНумератором", state: "Check" },
    { metadata: "Документ.ДокументКнопкаСПараметрамиExt", state: "Modify" },
  ] as const

  it("соединяет использование и режим по Метаданные в порядке ExtensionProperty", () => {
    const joined = joinExchangePlanExtensionContent(items, states)

    expect(joined).toEqual(extensionContentYAML)
    for (const index of [0, 4, 6]) {
      expect(yamlScalarTagAt(joined[index]!, "Метаданные")).toBe("изменять")
    }
    for (const index of [1, 2, 3, 5]) {
      expect(yamlScalarTagAt(joined[index]!, "Метаданные")).toBeUndefined()
    }
  })

  it("разделяет смысловой YAML обратно на две XML-коллекции", () => {
    const joined = joinExchangePlanExtensionContent(items, states)

    expect(splitExchangePlanExtensionContent(joined)).toEqual({
      items: [items[0], items[3], items[1], items[2]],
      states,
    })
  })

  it.each([
    [[items[0]!, items[0]!], states, "дубликат Metadata"],
    [items, [states[0]!, states[0]!], "дубликат Metadata"],
    [[], [{ metadata: "Документ.Один", state: "Unknown" }], "неизвестный State"],
  ] as const)("отклоняет некорректный вход", (content, extensionStates, message) => {
    expect(() => joinExchangePlanExtensionContent(content, extensionStates as never)).toThrow(message)
  })

  it("требует режим для каждого используемого элемента", () => {
    expect(() => joinExchangePlanExtensionContent(items, states.slice(0, 1))).toThrow("не задан режим")
  })

  it("запрещает Авторегистрацию у выключенного элемента", () => {
    expect(() => splitExchangePlanExtensionContent([{
      Метаданные: "Документ.Один",
      Авторегистрация: "Разрешить",
      Использовать: "Ложь",
    }])).toThrow("Авторегистрация")
  })
})
