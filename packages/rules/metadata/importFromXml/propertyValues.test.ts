import { describe, expect, it } from "vitest"
import { ImportPropertyValues } from "./propertyValues"

describe("ImportPropertyValues", () => {
  it("разделяет ключи и сегменты, не удерживая изменяемый путь", () => {
    const values = new ImportPropertyValues<{ value: string }>()
    const path = ["А/~:Б", 0]
    const first = { value: "первое" }
    values.set(path, "поле:имя", first)
    values.set(["А/~:Б", "0"], "поле:имя", { value: "строковый ключ" })
    values.set([], "поле:имя", { value: "корень" })
    path[0] = "изменено"
    expect(values.get(["А/~:Б", 0], "поле:имя")).toBe(first)
    expect(values.get(["А/~:Б", "0"], "поле:имя")).toEqual({ value: "строковый ключ" })
    expect(values.get([], "поле:имя")).toEqual({ value: "корень" })
    expect(values.get(path, "поле:имя")).toBeUndefined()
    expect(values.get(["А/~:Б", 0], "другое")).toBeUndefined()
    expect([...values.keys(["А/~:Б", 0])]).toEqual(["поле:имя"])
    expect([...values.keys(["отсутствует"])]).toEqual([])
    expect(values.size).toBe(3)
    values.set(["А/~:Б", 0], "поле:имя", { value: "обновлено" })
    expect(values.size).toBe(3)
    expect([...values.values()].map(entry => entry.value).sort())
      .toEqual(["корень", "обновлено", "строковый ключ"])
  })

  it("читает глубокий путь и перечисляет значения без рекурсии", () => {
    const values = new ImportPropertyValues<{ value: undefined }>()
    const path = Array.from({ length: 12000 }, (_, index) => index)
    const present = { value: undefined }
    values.set(path, "поле", present)
    expect(values.get(path, "поле")).toBe(present)
    expect([...values.values()]).toEqual([present])
    expect(values.size).toBe(1)
  })

  it("находит ближайшего строгого родителя за один проход, не смешивая числовые и строковые сегменты", () => {
    const values = new ImportPropertyValues<{ value: string }>()
    values.set([], "адрес", { value: "корень" })
    values.set(["А"], "адрес", { value: "владелец" })
    values.set(["А", 0], "адрес", { value: "числовой" })
    values.set(["А", "0"], "адрес", { value: "строковый" })
    values.set(["А", 0, "Б"], "адрес", { value: "сам элемент" })
    const segments = ["А", 0, "Б", "В"]
    let reads = 0
    Object.defineProperty(segments, 0, { get() { reads++; return "А" } })
    expect(values.nearestParent(segments, "адрес")).toEqual({ value: "сам элемент" })
    expect(reads).toBe(1)
    expect(values.nearestParent(["А", 0, "Б"], "адрес")).toEqual({ value: "числовой" })
    expect(values.nearestParent(["А", "0", "Б"], "адрес")).toEqual({ value: "строковый" })
    expect(values.nearestParent(["А", "нет", "Б"], "адрес")).toEqual({ value: "владелец" })
    expect(values.nearestParent(["А"], "адрес")).toBeUndefined()
    expect(values.nearestParent([], "адрес")).toBeUndefined()
    expect(values.nearestParent(segments, "другое")).toBeUndefined()
  })
})
