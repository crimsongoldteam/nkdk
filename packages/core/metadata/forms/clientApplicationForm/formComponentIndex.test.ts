import { describe, expect, it } from "vitest"
import { indexClientApplicationFormComponents } from "./formComponentIndex"

describe("индекс компонентов формы", () => {
  it("индексирует все категории и рекурсивные элементы с YAML-путями", () => {
    const index = indexClientApplicationFormComponents({
      Элементы: { Группа: { Элементы: { Поле: {} } } },
      Реквизиты: { Объект: {} },
      Команды: { Записать: {} },
      Параметры: { Режим: {} },
    })

    expect([...index.elements.values()]).toEqual([
      { name: "Группа", path: "Элементы.Группа" },
      { name: "Поле", path: "Элементы.Группа.Элементы.Поле" },
    ])
    expect(index.attributes.get("Объект")?.path).toBe("Реквизиты.Объект")
    expect(index.commands.get("Записать")?.path).toBe("Команды.Записать")
    expect(index.parameters.get("Режим")?.path).toBe("Параметры.Режим")
  })

  it("запрещает повтор имени элемента во всём дереве", () => {
    expect(() => indexClientApplicationFormComponents({
      Элементы: { Первая: { Элементы: { Поле: {} } }, Вторая: { Элементы: { Поле: {} } } },
    })).toThrow("Повтор имени элемента «Поле»")
  })
})
