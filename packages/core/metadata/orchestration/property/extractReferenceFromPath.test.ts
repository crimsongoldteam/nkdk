import { describe, expect, it } from "vitest"
import { extractReferenceFromPath } from "./extractReferenceFromPath"

describe("extractReferenceFromPath", () => {
  it("валидный путь Catalog.X → Справочник.X", () => {
    const ref = extractReferenceFromPath("Catalog.Контрагенты")
    expect(ref).toEqual({ id: "Справочник.Контрагенты", name: "Контрагенты", positionFrom: undefined })
  })

  it("валидный путь Document.X → Документ.X", () => {
    const ref = extractReferenceFromPath("Document.РасходнаяНакладная")
    expect(ref?.id).toBe("Документ.РасходнаяНакладная")
    expect(ref?.name).toBe("РасходнаяНакладная")
  })

  it("валидный путь Enum.X → Перечисление.X", () => {
    const ref = extractReferenceFromPath("Enum.СтатусЗаказа")
    expect(ref?.id).toBe("Перечисление.СтатусЗаказа")
    expect(ref?.name).toBe("СтатусЗаказа")
  })

  it("валидный путь InformationRegister.X → РегистрСведений.X", () => {
    const ref = extractReferenceFromPath("InformationRegister.Продажи")
    expect(ref?.id).toBe("РегистрСведений.Продажи")
    expect(ref?.name).toBe("Продажи")
  })

  it("пробрасывает position", () => {
    const ref = extractReferenceFromPath("Catalog.Товары", { offset: 42, length: 15 })
    expect(ref?.positionFrom).toEqual({ offset: 42, length: 15 })
  })

  it("пробрасывает position без length", () => {
    const ref = extractReferenceFromPath("Catalog.Товары", { offset: 7 })
    expect(ref?.positionFrom).toEqual({ offset: 7 })
  })

  it("пустая строка → undefined", () => {
    expect(extractReferenceFromPath("")).toBeUndefined()
  })

  it("путь без точки → undefined", () => {
    expect(extractReferenceFromPath("Catalog")).toBeUndefined()
  })

  it("неизвестный префикс → undefined", () => {
    expect(extractReferenceFromPath("UnknownType.X")).toBeUndefined()
  })

  it("без position → positionFrom undefined", () => {
    const ref = extractReferenceFromPath("Catalog.Товары")
    expect(ref?.positionFrom).toBeUndefined()
  })
})
