import { createXmlAnomalyAnnotations } from "@nkdk/runtime"
import { describe, expect, it } from "vitest"
import { createBaseFormProofPreparation } from "./baseFormProofPreparation"
import { yamlBaseFormProjectionSource } from "../forms/clientApplicationForm/baseFormProjectionSource"

describe("подготовка YAML основы к локальному сравнению", () => {
  it("не сокращает массив проекции с незаполненными позициями", () => {
    const values = new Array<unknown>(3)
    values[2] = { Значение: "Третье" }
    const prepare = createBaseFormProofPreparation(
      yamlBaseFormProjectionSource({ Значения: values }), createXmlAnomalyAnnotations(),
    )
    const root = { Значения: ["Первое", "Второе", "Третье"] }
    prepare(root, [])
    expect(root).toEqual({ Значения: [undefined, undefined, { Значение: "Третье" }] })
  })

  it("сохраняет смену формы значения между скаляром, отображением и массивом", () => {
    const prepare = createBaseFormProofPreparation(yamlBaseFormProjectionSource({
      Строка: "Текст", Отображение: { Имя: "Имя" }, Массив: [{ Имя: "Имя" }],
    }), createXmlAnomalyAnnotations())
    const root = { Строка: { ru: "Текст" }, Отображение: [1], Массив: { Лишнее: 1 } }
    prepare(root, [])
    expect(root).toEqual({ Строка: "Текст", Отображение: { Имя: "Имя" }, Массив: [{ Имя: "Имя" }] })
  })

  it("не читает и не переписывает завершённое дочернее значение при подготовке родителя", () => {
    let childReads = 0
    const source = {
      Элементы: {
        get Поле() {
          childReads += 1
          return { Вид: "ПолеВвода", Ширина: 22 }
        },
      },
    }
    const prepare = createBaseFormProofPreparation(yamlBaseFormProjectionSource(source), createXmlAnomalyAnnotations())
    const field = { Вид: "ПолеВвода", Ширина: 99 }
    prepare(field, ["Элементы", "Поле"])
    expect(field).toEqual({ Вид: "ПолеВвода", Ширина: 22 })
    const readsAfterChild = childReads
    Object.freeze(field)
    const root = { Элементы: { Поле: field }, Высота: 123 }

    prepare(root, [])

    expect(root).toEqual({ Элементы: { Поле: { Вид: "ПолеВвода", Ширина: 22 } } })
    expect(root.Элементы.Поле).toBe(field)
    expect(childReads).toBe(readsAfterChild)
  })

  it("обрабатывает ещё не завершённые значения в массивах", () => {
    const prepare = createBaseFormProofPreparation(
      yamlBaseFormProjectionSource({ Значения: [{ Имя: "Первое" }, { Имя: "Второе" }] }),
      createXmlAnomalyAnnotations(),
    )
    const first = { Имя: "Старое" }
    prepare(first, ["Значения", 0])
    Object.freeze(first)
    const root = { Значения: [first, { Имя: "Старое" }, { Имя: "Лишнее" }] }
    prepare(root, [])
    expect(root).toEqual({ Значения: [{ Имя: "Первое" }, { Имя: "Второе" }] })
    expect(root.Значения[0]).toBe(first)
  })
})
