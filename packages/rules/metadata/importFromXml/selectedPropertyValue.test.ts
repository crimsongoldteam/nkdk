import { describe, expect, it } from "vitest"
import { createSelectedPropertyValue } from "./selectedPropertyValue"

describe("выбранное значение зависимости", () => {
  it("не изменяет входной контейнер при добавлении вложенного факта", () => {
    const source = { Часть: { Первое: 1 } }
    const selected = createSelectedPropertyValue()
    selected.accept([], source)
    selected.accept(["Часть", "Второе"], 2)
    expect(selected.finish()).toEqual({ Часть: { Первое: 1, Второе: 2 } })
    expect(source).toEqual({ Часть: { Первое: 1 } })
  })

  it("сохраняет пустой элемент списка и освобождает завершённое значение", () => {
    const selected = createSelectedPropertyValue()
    selected.accept([], [])
    selected.accept([0], undefined)
    const value = selected.finish()
    expect(value).toEqual([undefined])
    expect(Object.hasOwn(value as object, 0)).toBe(true)
    expect(selected.finish()).toBeUndefined()
  })

  it("считает __proto__ обычным ключом, не прототипом", () => {
    const selected = createSelectedPropertyValue()
    selected.accept(["__proto__", "test"], true)
    const value = selected.finish()
    expect(Object.getPrototypeOf(value)).toBe(Object.prototype)
    expect(Object.hasOwn(value as object, "__proto__")).toBe(true)
  })
})
