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
})
