import { describe, expect, it } from "vitest"
import { extractReferenceFromPath } from "./extractReferenceFromPath"

describe("extractReferenceFromPath", () => {
  it("валидный путь Catalog.X → Catalog.X", () => {
    const ref = extractReferenceFromPath("Catalog.Контрагенты")
    expect(ref).toEqual({ id: "Catalog.Контрагенты", name: "Контрагенты", positionFrom: undefined })
  })

  it("валидный путь Document.X → Document.X", () => {
    const ref = extractReferenceFromPath("Document.РасходнаяНакладная")
    expect(ref?.id).toBe("Document.РасходнаяНакладная")
    expect(ref?.name).toBe("РасходнаяНакладная")
  })

  it("валидный путь Enum.X → Enum.X", () => {
    const ref = extractReferenceFromPath("Enum.СтатусЗаказа")
    expect(ref?.id).toBe("Enum.СтатусЗаказа")
    expect(ref?.name).toBe("СтатусЗаказа")
  })

  it("валидный путь InformationRegister.X → InformationRegister.X", () => {
    const ref = extractReferenceFromPath("InformationRegister.Продажи")
    expect(ref?.id).toBe("InformationRegister.Продажи")
    expect(ref?.name).toBe("Продажи")
  })

  it("пробрасывает position", () => {
    const ref = extractReferenceFromPath("Catalog.Товары", {
      offset: 42,
      line: 3,
      column: 7,
      length: 15,
    })
    expect(ref?.positionFrom).toEqual({ offset: 42, line: 3, column: 7, length: 15 })
  })

  it("пробрасывает position без length", () => {
    const ref = extractReferenceFromPath("Catalog.Товары", { offset: 7, line: 1, column: 8 })
    expect(ref?.positionFrom).toEqual({ offset: 7, line: 1, column: 8 })
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
